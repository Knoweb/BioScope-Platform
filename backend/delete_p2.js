import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const DEVICE_ID = 'P2';

async function run() {
    console.log(`Deleting data for device ${DEVICE_ID}...`);

    const tables = [
        'readings',
        'control_actions',
        'alerts',
        'alert_rules',
        'automation_rules',
        'actuators',
        'sensors',
        'device_settings',
        'audit_log'
    ];

    for (const table of tables) {
        console.log(`Deleting from ${table}...`);
        const { data, error } = await supabase.from(table).delete().eq('device_id', DEVICE_ID);
        if (error) {
            console.warn(`Could not delete from ${table}:`, error.message);
        } else {
            console.log(`Cleared ${table} for ${DEVICE_ID}`);
        }
    }

    // Also delete child units if parent_id = P2?
    console.log('Checking for child units of P2...');
    const { data: children } = await supabase.from('devices').select('device_id').eq('parent_id', DEVICE_ID);
    if (children && children.length > 0) {
        for (const child of children) {
            console.log(`Child unit found: ${child.device_id}, but we will only delete P2 directly for now. (Or should we delete it too?)`);
            // If instructed to delete P2 data, typically children go away too. Let's delete children's data:
            for (const table of tables) {
                await supabase.from(table).delete().eq('device_id', child.device_id);
            }
            await supabase.from('devices').delete().eq('device_id', child.device_id);
            console.log(`Deleted child unit ${child.device_id}`);
        }
    }

    console.log(`Deleting ${DEVICE_ID} from devices...`);
    const { error: devErr } = await supabase.from('devices').delete().eq('device_id', DEVICE_ID);
    if (devErr) {
        console.error(`Failed to delete device ${DEVICE_ID}:`, devErr.message);
    } else {
        console.log(`Deleted device ${DEVICE_ID}.`);
    }

    // Just to be sure, check if there's a parent_devices table
    const { error: pdErr } = await supabase.from('parent_devices').delete().eq('device_id', DEVICE_ID);
    if (pdErr) {
        console.warn(`Could not delete from parent_devices:`, pdErr.message);
    }

    console.log('\nDone removing P2 data.');
}

run().catch(console.error);
