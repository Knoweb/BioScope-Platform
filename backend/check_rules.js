import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { data, error } = await supabase.from('automation_rules').select('*').limit(10);
if (error) console.error(error);
console.log(JSON.stringify(data, null, 2));
