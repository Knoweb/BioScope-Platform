import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

async function analyzeDb() {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY

    // Query REST API for openapi spec
    try {
        const response = await fetch(`${url}/rest/v1/?apikey=${key}`)
        const data = await response.json()
        const tables = Object.keys(data.definitions || {})

        let output = "Found tables: " + tables.join(', ') + "\n";

        const focusTables = ['devices', 'parent_units', 'child_units', 'parent_devices', 'readings']
        for (const t of focusTables) {
            if (data.definitions[t]) {
                const props = Object.keys(data.definitions[t].properties || {})
                output += `\nTable [${t}] columns: ${props.join(', ')}\n`
                output += JSON.stringify(data.definitions[t].properties, null, 2) + "\n"
            } else {
                output += `\nTable [${t}] does NOT exist in public schema.\n`
            }
        }
        fs.writeFileSync('analyze_db_output.txt', output)
    } catch (err) {
        console.error("Error fetching OpenAPI spec:", err)
    }
}
analyzeDb()
