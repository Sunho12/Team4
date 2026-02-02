import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndDropUsername() {
  console.log('🔍 Checking if username column exists in profiles table...\n')

  try {
    // Try to fetch a profile and see if username field exists
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error checking table:', error)
      process.exit(1)
    }

    if (data) {
      const hasUsername = 'username' in data
      console.log(`📊 Username column exists: ${hasUsername}`)

      if (hasUsername) {
        console.log('\n⚠️  Username column found in profiles table')
        console.log('Note: Username column needs to be dropped via SQL migration.')
        console.log('Run the SQL migration file directly in Supabase Dashboard SQL Editor.')
      } else {
        console.log('\n✅ No username column found in profiles table')
        console.log('The table structure is clean!')
      }

      console.log('\nCurrent profile columns:', Object.keys(data))
    } else {
      console.log('ℹ️  No profiles found in table to check')
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

checkAndDropUsername()
