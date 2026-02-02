import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const migrationFiles = [
  '004_add_username_auth.sql',
  '005_user_triggers.sql',
  '006_user_rls.sql',
]

async function applyMigrations() {
  console.log('Starting migration process...')

  for (const file of migrationFiles) {
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', file)

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Migration file not found: ${file}`)
      continue
    }

    console.log(`\n📄 Applying migration: ${file}`)
    const sql = fs.readFileSync(filePath, 'utf-8')

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql })

      if (error) {
        console.error(`❌ Error applying ${file}:`, error)
      } else {
        console.log(`✅ Successfully applied: ${file}`)
      }
    } catch (err) {
      console.error(`❌ Exception while applying ${file}:`, err)
    }
  }

  console.log('\n✨ Migration process completed!')
}

applyMigrations()
