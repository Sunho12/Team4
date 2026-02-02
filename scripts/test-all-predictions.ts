import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { analyzePurchaseIntent } from '../lib/ai/predict'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAllPredictions() {
  console.log('🧪 Testing predictions for all customers with demographics...\n')

  // Get all customers with demographics
  const { data: customers } = await supabase
    .from('customer_demographics')
    .select('session_id, customer_tier, age_range')
    .limit(5) // Test first 5 customers

  if (!customers || customers.length === 0) {
    console.log('❌ No customers found')
    return
  }

  console.log(`Found ${customers.length} customers to test\n`)

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i]

    const { data: session } = await supabase
      .from('customer_sessions')
      .select('customer_name')
      .eq('id', customer.session_id)
      .single()

    console.log(`\n${'='.repeat(60)}`)
    console.log(`${i + 1}. ${session?.customer_name} (${customer.age_range}, ${customer.customer_tier})`)
    console.log('='.repeat(60))

    try {
      const startTime = Date.now()
      const predictions = await analyzePurchaseIntent(customer.session_id)
      const elapsed = Date.now() - startTime

      if (predictions.length === 0) {
        console.log(`   ℹ️  No predictions (${elapsed}ms)`)
      } else {
        console.log(`   ✅ ${predictions.length} predictions in ${elapsed}ms:`)
        predictions.forEach(p => {
          console.log(`      - ${p.prediction_type}: ${(p.probability_score * 100).toFixed(0)}% (${p.confidence})`)
        })
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
    }

    // Small delay to avoid rate limits
    if (i < customers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary')
  console.log('='.repeat(60))

  const { data: allPredictions } = await supabase
    .from('purchase_predictions')
    .select('prediction_type, confidence, session_id')

  if (allPredictions) {
    const byType = allPredictions.reduce((acc: any, p) => {
      acc[p.prediction_type] = (acc[p.prediction_type] || 0) + 1
      return acc
    }, {})

    const byConfidence = allPredictions.reduce((acc: any, p) => {
      acc[p.confidence] = (acc[p.confidence] || 0) + 1
      return acc
    }, {})

    console.log(`\nTotal predictions: ${allPredictions.length}`)
    console.log('\nBy type:')
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })
    console.log('\nBy confidence:')
    Object.entries(byConfidence).forEach(([conf, count]) => {
      console.log(`   ${conf}: ${count}`)
    })
  }

  console.log('\n✅ Test completed!')
}

testAllPredictions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
