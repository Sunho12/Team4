import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Running migration 006_cleanup_profiles_phone_format.sql...\n')

  try {
    // Check current profiles before migration
    const { data: beforeData, error: beforeError } = await supabase
      .from('profiles')
      .select('id, phone_number, full_name')

    if (beforeError) {
      console.error('❌ Error fetching current profiles:', beforeError)
      process.exit(1)
    }

    console.log(`📊 Current profiles count: ${beforeData?.length || 0}`)
    const nullPhones = beforeData?.filter(p => !p.phone_number).length || 0
    console.log(`📊 Profiles with null phone_number: ${nullPhones}`)

    if (nullPhones > 0) {
      console.log('\n🗑️  Profiles to be deleted:')
      beforeData?.filter(p => !p.phone_number).slice(0, 10).forEach(p => {
        console.log(`   - ${p.full_name || 'Unknown'} (ID: ${p.id})`)
      })
      if (nullPhones > 10) {
        console.log(`   ... and ${nullPhones - 10} more`)
      }
    }
    console.log()

    // Step 1: Delete profiles with null phone_number
    console.log('⏳ Step 1: Deleting profiles with null phone_number...')
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .is('phone_number', null)

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError)
      process.exit(1)
    }
    console.log(`✅ Deleted ${nullPhones} profiles with null phone_number\n`)

    // Step 2: Format phone numbers
    console.log('⏳ Step 2: Formatting phone numbers...')
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, phone_number')

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError)
      process.exit(1)
    }

    let updateCount = 0
    for (const profile of profiles || []) {
      if (!profile.phone_number) continue

      let formatted = profile.phone_number

      // Format to 000-0000-0000
      if (/^\d{3}-\d{4}-\d{4}$/.test(formatted)) {
        // Already in correct format
        continue
      } else if (/^\d{11}$/.test(formatted)) {
        // 01012345678 -> 010-1234-5678
        formatted = formatted.slice(0, 3) + '-' + formatted.slice(3, 7) + '-' + formatted.slice(7)
      } else if (/^\d{3}-?\d{3,4}-?\d{4}$/.test(formatted)) {
        // Remove all dashes and reformat
        const digits = formatted.replace(/-/g, '')
        formatted = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7)
      } else if (formatted.startsWith('+82')) {
        // +821012345678 -> 010-1234-5678
        const digits = '0' + formatted.slice(3).replace(/-/g, '')
        if (digits.length === 11) {
          formatted = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7)
        }
      }

      if (formatted !== profile.phone_number) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ phone_number: formatted })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`❌ Failed to update ${profile.id}:`, updateError)
        } else {
          updateCount++
        }
      }
    }

    console.log(`✅ Updated ${updateCount} phone numbers\n`)

    // Check profiles after migration
    const { data: afterData, error: afterError } = await supabase
      .from('profiles')
      .select('id, phone_number, full_name')

    if (afterError) {
      console.error('❌ Error fetching updated profiles:', afterError)
    } else {
      console.log(`📊 Final profiles count: ${afterData?.length || 0}`)
      console.log(`📊 Total profiles deleted: ${(beforeData?.length || 0) - (afterData?.length || 0)}`)
      console.log()

      // Show sample phone numbers
      if (afterData && afterData.length > 0) {
        console.log('📱 Sample phone numbers after formatting:')
        afterData.slice(0, 10).forEach(profile => {
          console.log(`   - ${profile.phone_number} (${profile.full_name || 'Unknown'})`)
        })
      }
    }

    console.log('\n✨ Migration completed successfully!')
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

runMigration()
