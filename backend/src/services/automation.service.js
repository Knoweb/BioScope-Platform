import { supabase } from '../config/supabase.js';

/**
 * Evaluates a simple condition string like "temperature > 30" or
 * "light_level < 1000" against a sensor reading object.
 */
function evaluateCondition(conditionString, reading) {
    if (!conditionString || !reading) return false;
    try {
        let parsed = conditionString.toLowerCase();
        const metrics = ['temperature', 'humidity', 'light_level', 'soil_moisture'];
        for (const m of metrics) {
            if (parsed.includes(m)) {
                const val = Number(reading[m]);
                if (isNaN(val)) return false;
                parsed = parsed.split(m).join(val);
            }
        }
        parsed = parsed.replace(/and/g, '&&').replace(/or/g, '||');
        if (/[a-zA-Z]/.test(parsed)) return false;
        return Boolean(new Function(`return ${parsed}`)());
    } catch (e) {
        console.error('[AutoEngine] evaluateCondition error:', conditionString, e.message);
        return false;
    }
}

class AutomationService {
    constructor() {
        // Per-device lock: prevents concurrent evaluation for the same device
        this._evaluating = new Set();
    }

    async _getLatestReadingForDevice(device_id) {
        // 1) Try direct readings for this device id (works for child ids).
        let { data: reading } = await supabase
            .from('readings')
            .select('temperature, humidity, light_level, recorded_at')
            .eq('device_id', device_id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (reading) return reading;

        // 2) If this is a parent unit id, resolve its highest-priority child and use that reading.
        const { data: child } = await supabase
            .from('child_units')
            .select('unit_id')
            .eq('parent_unit_id', device_id)
            .order('priority', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (!child?.unit_id) return null;

        ({ data: reading } = await supabase
            .from('readings')
            .select('temperature, humidity, light_level, recorded_at')
            .eq('device_id', child.unit_id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle());

        return reading || null;
    }

    /**
     * Core evaluation loop:
     * 1. Load last known state (fan/heater/light) from control_actions
     * 2. Evaluate each rule; override state only when rule matches
     * 3. Enforce Fan↔Heater mutex (Fan wins)
     * 4. Write new control_actions row
     * 5. Update actuators table rows (by device name)
     */
    async evaluate(device_id) {
        if (this._evaluating.has(device_id)) {
            console.log(`[AutoEngine] Skip — already running for ${device_id}`);
            return null;
        }
        this._evaluating.add(device_id);
        console.log(`[AutoEngine] Evaluating ${device_id}`);

        try {
            // ── 0. Check control mode ─────────────────────────────────────────────
            const { data: parentUnit } = await supabase
                .from('parent_units')
                .select('control_mode')
                .eq('unit_id', device_id)
                .single();

            if (parentUnit?.control_mode === 'manual') {
                console.log(`[AutoEngine] Skipped ${device_id} — manual mode`);
                return null;
            }

            // ── 1. Latest sensor reading ──────────────────────────────────────────
            const reading = await this._getLatestReadingForDevice(device_id);

            if (!reading) {
                console.log(`[AutoEngine] No reading found for ${device_id}`);
                return null;
            }
            console.log(`[AutoEngine] Reading: T=${reading.temperature}°C L=${reading.light_level}lux`);

            // ── 2. Last known device states (fallback when no rule fires) ─────────
            const { data: lastAction } = await supabase
                .from('control_actions')
                .select('fan_state, heater_state, light_state')
                .eq('device_id', device_id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            // Start from previous state — no rule match = no change (dead band preserved)
            const resolved = {
                fan: lastAction?.fan_state ?? 'off',
                heater: lastAction?.heater_state ?? 'off',
                light: lastAction?.light_state ?? 'off',
            };
            console.log(`[AutoEngine] Previous state: fan=${resolved.fan} heater=${resolved.heater} light=${resolved.light}`);

            // ── 3. Evaluate rules ─────────────────────────────────────────────────
            // Rules are evaluated in their creation order.
            const rulesQuery = supabase
                .from('automation_rules')
                .select('*')
                .eq('device_id', device_id)
                .eq('is_active', true);

            const { data: rules } = await rulesQuery.order('created_at', { ascending: true });

            const ruleLog = [];
            for (const rule of (rules || [])) {
                const matched = evaluateCondition(rule.trigger_condition, reading);
                if (matched && rule.action) {
                    const [rawDevice, state] = rule.action.split(':');
                    // Normalize "act1_fan" / "act2_heater" / "act1_light" → "fan" / "heater" / "light"
                    const keyMatch = rawDevice && rawDevice.match(/(fan|heater|light)/i);
                    const device = keyMatch ? keyMatch[1].toLowerCase() : (rawDevice || '').toLowerCase();
                    if (device && state && resolved.hasOwnProperty(device)) {
                        resolved[device] = state.trim().toLowerCase(); // normalize to lowercase (avoids 'ON' vs 'on' mismatch)
                        ruleLog.push(`${rule.name} → ${device}:${state}`);
                        console.log(`[AutoEngine] Rule matched: "${rule.name}" → ${device}:${state}`);
                    }
                }
            }

            // ── 4. Fan ↔ Heater mutex — Fan takes priority ────────────────────────
            if (resolved.fan === 'on' && resolved.heater === 'on') {
                console.log('[AutoEngine] Mutex: both fan+heater ON → heater forced OFF');
                resolved.heater = 'off';
            }
            console.log(`[AutoEngine] Resolved: fan=${resolved.fan} heater=${resolved.heater} light=${resolved.light}`);

            // ── 5. Load slot assignments ──────────────────────────────────────────
            const { data: settings } = await supabase
                .from('device_settings')
                .select('slot_1_device, slot_2_device')
                .eq('device_id', device_id)
                .single();

            const slot1Device = settings?.slot_1_device ?? 'fan';
            const slot2Device = settings?.slot_2_device ?? 'light';
            const slotStates = {
                slot_1: resolved[slot1Device] ?? 'off',
                slot_2: resolved[slot2Device] ?? 'off',
            };

            // ── 6. Persist new control_actions row ────────────────────────────────
            const { error: caErr } = await supabase.from('control_actions').insert([{
                device_id,
                actuator_id: null,          // automation targets all actuators collectively
                action_type: 'auto_evaluate',
                new_status: resolved.fan === 'on' || resolved.heater === 'on' || resolved.light === 'on',
                fan_state: resolved.fan,
                heater_state: resolved.heater,  
                light_state: resolved.light,
                status: 'success',
                reason: ruleLog.length ? ruleLog.join('; ') : 'No rule matched — previous state preserved',
            }]);
            if (caErr) console.error('[AutoEngine] control_actions insert error:', caErr.message);

            // ── 7. Apply to actuators table ───────────────────────────────────────
            // Only update the ONE actuator assigned to each slot:
            //   slot 1 device (e.g. "fan")   → actuator whose name matches "1" + "fan"  → "Actuator 1 Fan"
            //   slot 2 device (e.g. "light") → actuator whose name matches "2" + "light" → "Actuator 2 Light"
            // This prevents touching the unassigned actuators of the same type.
            const { data: actuators } = await supabase
                .from('actuators')
                .select('actuator_id, name, status')
                .eq('device_id', device_id)
                .is('deleted_at', null);

            const slotTargets = [
                { slotNum: '1', deviceKey: slot1Device, targetOn: resolved[slot1Device] === 'on' },
                { slotNum: '2', deviceKey: slot2Device, targetOn: resolved[slot2Device] === 'on' },
            ];

            for (const act of (actuators || [])) {
                const nameLower = act.name.toLowerCase();
                let targetStatus = null;

                for (const t of slotTargets) {
                    // Match by device key: "fan" → "Fan", "light" → "LED Light" / "Light", "heater" → "Heater"
                    // Also accept "led" as an alias for "light" since common actuator name is "LED Light"
                    const matchesKey = nameLower.includes(t.deviceKey) ||
                        (t.deviceKey === 'light' && nameLower.includes('led'));
                    if (matchesKey) {
                        targetStatus = t.targetOn;
                        break;
                    }
                }

                // Any actuator not assigned to one of the two active slots must be OFF.
                // This prevents stale ON states from unassigned devices (for example fan)
                // from confusing the UI and blocking mutually exclusive actuators.
                if (targetStatus === null) targetStatus = false;
                if (act.status === targetStatus) continue; // no change needed

                const { error: updErr } = await supabase
                    .from('actuators')
                    .update({ status: targetStatus, last_changed: new Date().toISOString() })
                    .eq('actuator_id', act.actuator_id);

                if (!updErr) {
                    await supabase.from('control_history').insert([{
                        device_id,
                        actuator: act.name,
                        command: targetStatus ? 'ON' : 'OFF',
                        triggered_by: 'Auto Evaluation',
                        status: 'success',
                    }]);
                    console.log(`[AutoEngine] Updated actuator "${act.name}" → ${targetStatus ? 'ON' : 'OFF'}`);
                }
            }

            return { resolved, slotStates, reading };

        } catch (e) {
            console.error('[AutoEngine] Error:', e);
            return null;
        } finally {
            this._evaluating.delete(device_id);
        }
    }

    /** Legacy compatibility — called by existing reading upload path */
    async processReadings(device_id, readingData) {
        return this.evaluate(device_id);
    }
}

export const automationService = new AutomationService();
