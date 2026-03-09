import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Get any valid user ID from the users table to satisfy the FK constraint
const { data: users, error: userErr } = await supabase.from('users').select('user_id').limit(1).single();
if (userErr) {
    console.error('Failed to get user:', userErr.message);
    console.log('Trying auth.users instead via admin API...');
}

const userId = users?.user_id;
console.log('Using user_id:', userId);

const rules = [
    {
        name: 'A1 Fan Auto-ON (High Temp)',
        device_id: 'P1',
        trigger_condition: 'temperature > 30',
        action: 'act1_fan:on',
        is_active: true,
        created_by_user_id: userId
    },
    {
        name: 'A1 Fan Auto-OFF (Normal Temp)',
        device_id: 'P1',
        trigger_condition: 'temperature < 25',
        action: 'act1_fan:off',
        is_active: true,
        created_by_user_id: userId
    },
    {
        name: 'A1 Light Auto-ON (Dark)',
        device_id: 'P1',
        trigger_condition: 'light_level < 200',
        action: 'act1_light:on',
        is_active: true,
        created_by_user_id: userId
    },
    {
        name: 'A2 Heater Auto-ON (Cold)',
        device_id: 'P1',
        trigger_condition: 'temperature < 20',
        action: 'act2_heater:on',
        is_active: true,
        created_by_user_id: userId
    },
    {
        name: 'A2 Heater Auto-OFF (Warm)',
        device_id: 'P1',
        trigger_condition: 'temperature > 28',
        action: 'act2_heater:off',
        is_active: true,
        created_by_user_id: userId
    }
];

console.log('\nInserting default automation rules...');
for (const rule of rules) {
    const { error } = await supabase.from('automation_rules').insert(rule);
    if (error) console.error('❌ Failed:', rule.name, '-', error.message);
    else console.log('✅ Inserted:', rule.name);
}

console.log('\nVerifying...');
const { data, error } = await supabase.from('automation_rules').select('rule_id, name, trigger_condition, action, is_active').eq('device_id', 'P1');
if (error) console.error(error);
else console.log(JSON.stringify(data, null, 2));
