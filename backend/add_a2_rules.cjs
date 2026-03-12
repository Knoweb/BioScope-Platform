require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
    const { data: users, error: userErr } = await supabase.from('users').select('user_id').limit(1).single();
    const userId = users?.user_id;

    const newRules = [
        {
            name: 'A2 Fan Auto-ON (High Temp)',
            device_id: 'P1',
            trigger_condition: 'temperature > 30',
            action: 'act2_fan:on',
            is_active: true,
            created_by_user_id: userId,
            priority: 10
        },
        {
            name: 'A2 Fan Auto-OFF (Normal Temp)',
            device_id: 'P1',
            trigger_condition: 'temperature < 25',
            action: 'act2_fan:off',
            is_active: true,
            created_by_user_id: userId,
            priority: 10
        }
    ];

    for (const rule of newRules) {
        const { error } = await supabase.from('automation_rules').insert(rule);
        if (error) console.error('Failed to insert rule:', error);
        else console.log(`Successfully added rule: ${rule.name}`);
    }
}

run();
