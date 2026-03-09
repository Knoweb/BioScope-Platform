import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

async function listDevices() {
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    const url = process.env.SUPABASE_URL
    const supabase = createClient(url, serviceKey)

    try {
        const { data, error } = await supabase.from('devices').select('*')
        if (error) throw error
        console.log(JSON.stringify(data, null, 2))
    } catch (err) {
        console.error('Failed:', err.message)
    }
}
listDevices()
