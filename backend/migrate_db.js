import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function migrate() {
    console.log('Starting DB Migration for Automation and History...');

    // 1. We need to create the control_history table using standard Postgrest RPC or raw query.
    // Since we might not have raw query access, we will use a raw SQL execution via RPC.
    // Wait, if RPC isn't defined for raw SQL, we might need a workaround or try to use PostgREST if it supports table creation? No, PostgREST doesn't support DDL.
    console.log('NOTE: Please run this SQL in your Supabase SQL Editor manually if the RPC fails.');

    const sql = `
    -- Create control_history table
    CREATE TABLE IF NOT EXISTS public.control_history (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        device_id text NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
        actuator text NOT NULL,
        command text NOT NULL,
        triggered_by text NOT NULL,
        status text NOT NULL,
        timestamp timestamptz DEFAULT now()
    );

    -- Add priority and complex condition columns to automation_rules if they don't exist
    ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS priority integer DEFAULT 10;
    
    -- Drop old rules matching 'turn_fan_on' etc to clean up
    DELETE FROM public.automation_rules WHERE action LIKE 'turn_%';
  `;

    console.log('\n--- SQL TO RUN IN SUPABASE ---');
    console.log(sql);
    console.log('------------------------------\n');

    // Let's try to clear the old rules using API just in case.
    const { error: delErr } = await supabase
        .from('automation_rules')
        .delete()
        .like('action', 'turn_%');

    if (delErr) {
        console.error('Failed to delete old rules via API:', delErr);
    } else {
        console.log('Successfully cleared obsolete rules via API.');
    }

    // Insert mock default rules mapped to the new layout
    const newRules = [
        {
            name: 'A1 Fan Auto-ON (High Temp)',
            device_id: 'P1',
            trigger_condition: 'temperature > 30',
            action: 'Set A1 Fan ON',
            action_json: { act1_fan: true },
            priority: 1,
            is_active: true
        },
        {
            name: 'A1 Fan Auto-OFF (Low Temp)',
            device_id: 'P1',
            trigger_condition: 'temperature < 25',
            action: 'Set A1 Fan OFF',
            action_json: { act1_fan: false },
            priority: 2,
            is_active: true
        },
        {
            name: 'A1 Light Auto-ON (Dark)',
            device_id: 'P1',
            trigger_condition: 'light_level < 200',
            action: 'Set A1 Light ON',
            action_json: { act1_light: true },
            priority: 1,
            is_active: true
        },
        {
            name: 'A2 Heater Auto-ON (Very Cold)',
            device_id: 'P1',
            trigger_condition: 'temperature < 20',
            action: 'Set A2 Heater ON',
            action_json: { act2_heater: true },
            priority: 1,
            is_active: true
        }
    ];

    for (const r of newRules) {
        const { error } = await supabase.from('automation_rules').insert(r);
        if (error) console.error('Failed to insert rule:', r.name, error.message);
        else console.log('Inserted new rule:', r.name);
    }

    console.log('Migration complete.');
}

migrate();
