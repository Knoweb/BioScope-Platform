import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    console.log('Fetching parent devices...');
    const { data: devices, error: devErr } = await supabase.from('devices').select('device_id').like('device_id', 'P%');
    if (devErr) throw devErr;
    console.log(`Found ${devices.length} parent devices.`);

    for (const device of devices) {
        console.log(`\nProcessing device ${device.device_id}...`);

        // Delete old actuators
        const { error: delErr } = await supabase.from('actuators').delete().eq('device_id', device.device_id);
        if (delErr) {
            console.error(`Failed to delete old actuators for ${device.device_id}:`, delErr);
            continue;
        }
        console.log(`Deleted old actuators for ${device.device_id}.`);

        // Insert new actuators
        const actuators = [
            { device_id: device.device_id, name: 'Actuator 1 Fan', type: 'relay', description: 'Actuator 1 Fan', is_active: true, auto_control_enabled: true, status: false, min_value: 0, max_value: 100 },
            { device_id: device.device_id, name: 'Actuator 1 Light', type: 'pwm', description: 'Actuator 1 Light', is_active: true, auto_control_enabled: true, status: false, min_value: 0, max_value: 100 },
            { device_id: device.device_id, name: 'Actuator 1 Heater', type: 'relay', description: 'Actuator 1 Heater', is_active: true, auto_control_enabled: true, status: false, min_value: 0, max_value: 100 },
            { device_id: device.device_id, name: 'Actuator 2 Fan', type: 'relay', description: 'Actuator 2 Fan', is_active: true, auto_control_enabled: true, status: false, min_value: 0, max_value: 100 },
            { device_id: device.device_id, name: 'Actuator 2 Light', type: 'pwm', description: 'Actuator 2 Light', is_active: true, auto_control_enabled: true, status: false, min_value: 0, max_value: 100 },
            { device_id: device.device_id, name: 'Actuator 2 Heater', type: 'relay', description: 'Actuator 2 Heater', is_active: true, auto_control_enabled: true, status: false, min_value: 0, max_value: 100 }
        ];

        const { error: insErr } = await supabase.from('actuators').insert(actuators);
        if (insErr) {
            console.error(`Failed to insert new actuators for ${device.device_id}:`, insErr);
        } else {
            console.log(`Inserted 6 new actuators for ${device.device_id}.`);
        }
    }

    console.log('\nDone.');
}

run().catch(console.error);
