import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function findConflict() {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    const supabase = createClient(url, key)

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'api-test@bioscope.io')

    console.log("Users with api-test@bioscope.io:", data)
}

findConflict()
