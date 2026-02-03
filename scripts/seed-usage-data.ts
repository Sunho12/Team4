/**
 * Seed script for data_usage table
 * Creates dummy data for monthly data usage tracking
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDataUsage() {
  console.log('🌱 Starting data_usage seeding...')

  try {
    // 1. Get existing user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, customer_name')
      .limit(50)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ No profiles found. Please run seed-all-conversations.ts first.')
      return
    }

    console.log(`✅ Found ${profiles.length} profiles`)

    // 2. Seed data_usage (current month)
    console.log('\n📡 Seeding data_usage for current month...')
    const currentMonth = new Date()
    currentMonth.setDate(1) // First day of the month

    const dataUsages = profiles.map(profile => {
      const speedLimits = ['300kbps', '1Mbps', '3Mbps']
      const speedLimit = speedLimits[Math.floor(Math.random() * speedLimits.length)]

      let dataUsed = 0
      let threshold = 0

      // Set thresholds and generate realistic data usage
      if (speedLimit === '300kbps') {
        threshold = 3
        dataUsed = Math.random() * 8 // 0-8GB (some exceed, some don't)
      } else if (speedLimit === '1Mbps') {
        threshold = 7
        dataUsed = Math.random() * 15 // 0-15GB
      } else {
        threshold = 15
        dataUsed = Math.random() * 30 // 0-30GB
      }

      return {
        user_id: profile.id,
        usage_month: currentMonth.toISOString().split('T')[0],
        data_used_gb: parseFloat(dataUsed.toFixed(2)),
        plan_speed_limit: speedLimit,
        plan_data_limit_gb: threshold,
        is_exceeded: dataUsed > threshold
      }
    })

    const { error: dataUsageError } = await supabase
      .from('data_usage')
      .insert(dataUsages)

    if (dataUsageError) {
      console.error('Error inserting data usage:', dataUsageError)
    } else {
      console.log(`✅ Inserted ${dataUsages.length} data usage records`)

      // Show some stats
      const exceeded = dataUsages.filter(d => d.is_exceeded).length
      console.log(`\n📊 Stats:`)
      console.log(`   - Total records: ${dataUsages.length}`)
      console.log(`   - Exceeded limit: ${exceeded} (${Math.round(exceeded / dataUsages.length * 100)}%)`)
      console.log(`   - 300kbps plans: ${dataUsages.filter(d => d.plan_speed_limit === '300kbps').length}`)
      console.log(`   - 1Mbps plans: ${dataUsages.filter(d => d.plan_speed_limit === '1Mbps').length}`)
      console.log(`   - 3Mbps plans: ${dataUsages.filter(d => d.plan_speed_limit === '3Mbps').length}`)
    }

    console.log('\n🎉 Data usage seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

// Run the seeding
seedDataUsage()
  .then(() => {
    console.log('\n✅ Script completed')
    // Add delay before exit to allow connections to close properly
    setTimeout(() => process.exit(0), 500)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    setTimeout(() => process.exit(1), 500)
  })
