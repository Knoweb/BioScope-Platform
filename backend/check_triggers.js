import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkDB() {
    const { data, error } = await supabase.rpc('get_functions_info');
    // if we can't get custom rpc easily, just run raw sql or look for edge functions
    console.log("We'll try pulling trigger info if a custom RPC exists, otherwise we'll fail gracefully.", error);
}

checkDB();
