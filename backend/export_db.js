import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// List of standard tables in the BioScope schema
const tables = [
    'users',
    'devices',
    'sensor_types',
    'sensors',
    'actuators',
    'readings',
    'alert_rules',
    'alerts',
    'control_actions',
    'device_settings',
    'user_preferences',
    'automation_rules',
    'audit_log'
];

async function exportData() {
    console.log('Starting data export from Supabase...');
    let sqlDump = '-- BioScope Data Export\n';
    sqlDump += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
        console.log(`Fetching data for table: ${table}...`);
        // Need to paginate or just fetch up to a limit if it's large. For now asking for 10,000 max.
        const { data, error } = await supabase.from(table).select('*').limit(10000);

        if (error) {
            console.error(`Error fetching table ${table}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            sqlDump += `-- Data for Name: ${table}; Type: TABLE DATA\n`;
            sqlDump += `INSERT INTO public.${table} (${Object.keys(data[0]).map(k => `"${k}"`).join(', ')}) VALUES\n`;

            const valuesList = data.map(row => {
                const values = Object.values(row).map(val => {
                    if (val === null) return 'NULL';
                    if (typeof val === 'number') return val;
                    if (typeof val === 'boolean') return val;
                    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
                    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
                    return `'${val}'`;
                });
                return `(${values.join(', ')})`;
            });

            sqlDump += valuesList.join(',\n') + ';\n\n';
            console.log(`-> Exported ${data.length} rows.`);
        } else {
            console.log(`-> No data found in ${table}.`);
        }
    }

    const outputPath = path.join(path.dirname(__dirname), 'bioscope_data_backup.sql');
    fs.writeFileSync(outputPath, sqlDump);
    console.log(`\n✅ Export complete! Data saved to: ${outputPath}`);
}

exportData().catch(console.error);
