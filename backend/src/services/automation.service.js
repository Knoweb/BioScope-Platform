import { supabase } from '../config/supabase.js';

/**
 * Service to evaluate automation rules against live sensor data and physical actuators.
 */
class AutomationService {
    constructor() {
        this.evaluating = false;
    }

    // Safe logic evaluator for expressions like "temperature > 30 AND humidity < 50"
    evaluateCondition(conditionString, readingsData) {
        if (!conditionString) return false;

        // Simplistic parser. E.g. "temperature > 30" -> splits to ["temperature", ">", "30"]
        // Handle AND/OR logic if it exists
        try {
            // Very basic evaluation using Function constructor securely. 
            // We only inject the numbers in place of the keys.
            let parsed = conditionString.toLowerCase();

            const metrics = ['temperature', 'humidity', 'light_level', 'soil_moisture'];
            for (const m of metrics) {
                if (parsed.includes(m)) {
                    const val = Number(readingsData[m]);
                    if (isNaN(val)) return false; // Metric not present, can't evaluate accurately
                    // Add spaces to prevent "something_temperature" accidental replace
                    // A safer regex replacement:
                    const regex = new RegExp(`\\b${m}\\b`, 'g');
                    parsed = parsed.replace(regex, val);
                }
            }

            parsed = parsed.replace(/and/g, '&&').replace(/or/g, '||');

            // Check if any alphabetical characters left (indicating unreplaced vars or bad logic)
            if (/[a-zA-Z]/.test(parsed)) return false;

            // Safe evaluation execution
            const result = new Function(`return ${parsed}`)();
            return Boolean(result);
        } catch (e) {
            console.error('Failed to parse automation condition:', conditionString, e);
            return false;
        }
    }

    /**
     * Evaluates all active rules for a specific parent device given its latest reading.
     * Ensures that the highest priority rule wins in case of conflicting actuator sets.
     */
    async processReadings(device_id, readingData) {
        if (this.evaluating) return;
        this.evaluating = true;

        try {
            // 1. Fetch active rules for the device ordered by priority (1 is highest priority)
            const { data: rules, error: rulesErr } = await supabase
                .from('automation_rules')
                .select('*')
                .eq('device_id', device_id)
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (rulesErr || !rules || rules.length === 0) {
                this.evaluating = false;
                return;
            }

            // We maintain a map of the actions we want to apply to resolve conflicts.
            // E.g. desiredActions = { 'act1_fan': { status: true, rule_id: '...', name: '...'} }
            const desiredActions = {};

            for (const rule of rules) {
                const isMatched = this.evaluateCondition(rule.trigger_condition, readingData);

                if (isMatched && rule.action) {
                    // Action format: "act1_fan:on" or "act2_heater:off"
                    const parts = rule.action.split(':');
                    if (parts.length === 2) {
                        const actuatorKey = parts[0].trim();
                        const targetStatus = parts[1].trim() === 'on';
                        if (!desiredActions[actuatorKey]) {
                            desiredActions[actuatorKey] = { targetStatus, rule };
                        }
                    }
                }
            }

            // If no actions to take, bail out.
            if (Object.keys(desiredActions).length === 0) {
                this.evaluating = false;
                return;
            }

            // 2. Fetch all physical actuators under this device to map their keys
            const { data: actuators, error: aErr } = await supabase
                .from('actuators')
                .select('actuator_id, name, status')
                .eq('device_id', device_id);

            if (aErr || !actuators) {
                this.evaluating = false;
                return;
            }

            // Map DB names to keys
            const actuatorMap = {};
            actuators.forEach(act => {
                const name = act.name.toLowerCase();
                let key = null;
                if (name.includes('actuator 1 fan')) key = 'act1_fan';
                else if (name.includes('actuator 1 light')) key = 'act1_light';
                else if (name.includes('actuator 1 heater')) key = 'act1_heater';
                else if (name.includes('actuator 2 fan')) key = 'act2_fan';
                else if (name.includes('actuator 2 light')) key = 'act2_light';
                else if (name.includes('actuator 2 heater')) key = 'act2_heater';

                if (key) {
                    actuatorMap[key] = act;
                }
            });

            // 3. Apply actions and track history. We only apply if the current status differs from target.
            for (const [key, intent] of Object.entries(desiredActions)) {
                const actuator = actuatorMap[key];
                if (!actuator) continue;

                if (actuator.status !== intent.targetStatus) {
                    // We need to actuate it!
                    console.log(`[Auto] Triggering ${actuator.name} -> ${intent.targetStatus ? 'ON' : 'OFF'} [Rule: ${intent.rule.name}]`);

                    const { error: updateErr } = await supabase
                        .from('actuators')
                        .update({
                            status: intent.targetStatus,
                            last_changed: new Date().toISOString()
                        })
                        .eq('actuator_id', actuator.actuator_id);

                    const finalStatus = updateErr ? 'failed' : 'success';

                    // Log the execution to control_history
                    await supabase.from('control_history').insert([{
                        device_id: device_id,
                        actuator: actuator.name,
                        command: intent.targetStatus ? 'ON' : 'OFF',
                        triggered_by: `Auto Rule: ${intent.rule.name}`,
                        status: finalStatus
                    }]);
                }
            }

        } catch (e) {
            console.error('[Automation Service Error]', e);
        } finally {
            this.evaluating = false;
        }
    }
}

export const automationService = new AutomationService();
