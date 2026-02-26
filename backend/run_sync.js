import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function syncUsers() {
    const serviceKey = process.env.SUPABASE_SERVICE_KEY
    const url = process.env.SUPABASE_URL
    const supabase = createClient(url, serviceKey)

    try {
        const { data: authRecord } = await supabase.auth.admin.listUsers()
        const users = authRecord?.users || []

        for (const u of users) {
            const payload = {
                user_id: u.id,
                email: u.email || 'unknown@email.com',
                name: u.user_metadata?.name || 'New User',
                role: 'user',
                password_hash: 'managed_by_supabase_auth'
            }

            console.log('Attempting Upsert with Payload:', payload)
            const { error: insertErr } = await supabase
                .from('users')
                .upsert(payload, { onConflict: 'user_id' })

            if (insertErr) {
                console.error(`Failed to sync user ${u.email}:`, insertErr.message)
            } else {
                console.log(`Synced user ${u.email} successfully!`)
            }
        }
    } catch (err) {
        console.error('Migration failed:', err.message)
    }
}

syncUsers()
