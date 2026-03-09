import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

async function updateDevices() {
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    const url = process.env.SUPABASE_URL
    const supabase = createClient(url, serviceKey)

    try {
        const { data: devices, error } = await supabase.from('devices').select('*')
        if (error) throw error

        console.log('Current devices:', devices.map(d => ({ id: d.device_id, name: d.name })))

        for (const device of devices) {
            let newName = null

            if (device.name === 'Enclosure Monitor Alpha') {
                newName = 'Parent Unit 1'
            } else if (device.name === 'Enclosure Monitor Alpha - Parent unit 1' || device.name === 'Enclosure Monitor Beta') {
                // If they have Beta or the exact string, change to Parent Unit 2
                newName = 'Parent Unit 2'
            }

            if (newName) {
                console.log(`Updating ${device.device_id} from "${device.name}" to "${newName}"`)
                const { error: updateErr } = await supabase
                    .from('devices')
                    .update({ name: newName })
                    .eq('device_id', device.device_id)

                if (updateErr) console.error(`Error updating ${device.device_id}:`, updateErr)
                else console.log(`Success updating ${device.device_id}`)
            }
        }
    } catch (err) {
        console.error('Failed:', err.message)
    }
}
updateDevices()
