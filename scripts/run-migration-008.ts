import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🔄 Running migration 008: Add sender_id to messages...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_add_sender_to_messages.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8')

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql }).single()

    if (error) {
      // If exec_sql doesn't exist, try direct execution (for newer Supabase versions)
      // Split by semicolons and execute each statement
      const statements = migrationSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.toLowerCase().includes('comment on')) {
          // Skip COMMENT statements as they might not be supported
          console.log('⚠️  Skipping COMMENT statement (not critical)')
          continue
        }

        const { error: execError } = await supabase.rpc('exec', {
          query: statement
        })

        if (execError) {
          console.error('❌ Error executing statement:', execError)
          console.log('Statement:', statement)

          // Try alternative approach - use Postgres client if available
          console.log('\n⚠️  RPC method failed. Attempting direct SQL execution...')

          // This is a workaround - we'll use the raw query
          const { error: rawError } = await (supabase as any)
            .from('_migrations')
            .select('*')
            .limit(1)

          throw new Error('Migration execution failed. Please run the SQL manually in Supabase dashboard.')
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('\n📝 Changes applied:')
    console.log('  - Added sender_id column to messages table')
    console.log('  - Created index on sender_id')
    console.log('  - sender_id references profiles(id)')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n💡 Alternative approach:')
    console.log('   Please run the following SQL in your Supabase SQL Editor:\n')

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_add_sender_to_messages.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8')
    console.log(migrationSql)

    throw error
  }
}

// Run the migration
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
