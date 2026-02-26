import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function setRole(email, newRole) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    const supabase = createClient(url, key)

    // Find the exact user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) return console.error('Error fetching users:', listError)

    const user = users.find(u => u.email === email)
    if (!user) return console.error(`User with email ${email} not found!`)

    // Update their user_metadata securely
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: newRole }
    })

    if (error) {
        console.error('Failed to update role:', error.message)
    } else {
        console.log(`✅ Success! ${email} is now an '${newRole}'.`)
        console.log(`Please log out and log back in on the frontend to refresh permissions.`)
    }
}

// Read email and role from command line arguments
const emailTarget = process.argv[2]
const roleTarget = process.argv[3]

if (!emailTarget || !roleTarget) {
    console.log("Usage: node set_role.js <email> <role>")
    console.log("Example: node set_role.js admin@bioscope.io admin")
} else {
    setRole(emailTarget, roleTarget)
}
