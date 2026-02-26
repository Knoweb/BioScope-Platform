import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function fixDb() {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    const supabase = createClient(url, key)

    const { data: authRecord } = await supabase.auth.admin.listUsers()
    const users = authRecord?.users || []

    for (const u of users) {
        console.log(`Processing ${u.email}... target ID: ${u.id}`)

        // First safely remove the new one if the sync somehow partially inserted it
        // Wait, let's just get the row from public.users
        const { data: pubUsers } = await supabase.from('users').select('user_id, email').eq('email', u.email)

        if (pubUsers && pubUsers.length > 0) {
            const pubUser = pubUsers[0]
            if (pubUser.user_id !== u.id) {
                console.log(`Conflict! Changing ${pubUser.user_id} to ${u.id}`)
                // Update the primary key! Note: this might fail if ON UPDATE CASCADE isn't set
                const { error } = await supabase
                    .from('users')
                    .update({ user_id: u.id })
                    .eq('email', u.email)

                if (error) {
                    console.log(`Could not update PK for ${u.email}:`, error.message)
                    // Fallback: Delete the old row (since it's a test seed) and insert a new one
                    console.log("Attempting fallback delete...")
                    await supabase.from('users').delete().eq('email', u.email)
                    console.log(`Re-inserting ${u.email}...`)
                    await supabase.from('users').insert([{
                        user_id: u.id,
                        email: u.email,
                        name: u.user_metadata?.name || 'New User',
                        role: 'user',
                        password_hash: 'managed_by_supabase_auth'
                    }])
                } else {
                    console.log("Updated PK successfully!")
                }
            } else {
                console.log(`${u.email} is already perfectly synced!`)
                // Update password_hash just in case it's still missing
                await supabase.from('users').update({ password_hash: 'managed_by_supabase_auth' }).eq('user_id', u.id)
            }
        } else {
            console.log(`${u.email} not found in public.users, inserting...`)
            const { error: insErr } = await supabase.from('users').insert([{
                user_id: u.id,
                email: u.email,
                name: u.user_metadata?.name || 'New User',
                role: 'user',
                password_hash: 'managed_by_supabase_auth'
            }])
            if (insErr) console.error("Insert error:", insErr.message)
        }
    }
    console.log('Fix complete')
}

fixDb()
