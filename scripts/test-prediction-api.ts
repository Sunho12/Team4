import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Import the prediction function directly
import { analyzePurchaseIntent } from '../lib/ai/predict'

async function testPredictionAPI() {
  console.log('🧪 Testing prediction API with new hybrid logic...\n')

  // Get a customer with demographics
  const { data: customer } = await supabase
    .from('customer_demographics')
    .select(`
      session_id,
      customer_tier,
      age_range,
      current_plan_type,
      average_monthly_usage_gb
    `)
    .limit(1)
    .single()

  if (!customer) {
    console.log('❌ No customer found')
    return
  }

  // Get session info
  const { data: session } = await supabase
    .from('customer_sessions')
    .select('customer_name, session_token')
    .eq('id', customer.session_id)
    .single()

  console.log('📋 Testing customer:')
  console.log(`   Name: ${session?.customer_name}`)
  console.log(`   Tier: ${customer.customer_tier}`)
  console.log(`   Age: ${customer.age_range}`)
  console.log(`   Plan: ${customer.current_plan_type}`)
  console.log(`   Usage: ${customer.average_monthly_usage_gb}GB`)
  console.log(`   Session ID: ${customer.session_id}\n`)

  // Show existing data summary
  const [devices, purchases, family, conversations] = await Promise.all([
    supabase.from('customer_devices').select('*').eq('session_id', customer.session_id).eq('is_current', true),
    supabase.from('purchase_history').select('*').eq('session_id', customer.session_id),
    supabase.from('family_members').select('*').eq('session_id', customer.session_id),
    supabase.from('conversations').select('*, conversation_summaries(*)').eq('session_id', customer.session_id)
  ])

  console.log('📊 Available data:')
  console.log(`   Devices: ${devices.data?.length || 0}`)
  console.log(`   Purchases: ${purchases.data?.length || 0}`)
  console.log(`   Family: ${family.data?.length || 0}`)
  console.log(`   Conversations: ${conversations.data?.length || 0}\n`)

  if (devices.data && devices.data.length > 0) {
    const device = devices.data[0]
    console.log('📱 Current device:')
    console.log(`   ${device.model_name} (${device.device_age_months} months old)`)
    console.log(`   Condition: ${device.condition}, Battery: ${device.battery_health_percent}%\n`)
  }

  if (family.data && family.data.length > 0) {
    console.log('👨‍👩‍👧‍👦 Family members:')
    family.data.forEach((m: any) => {
      console.log(`   ${m.relationship} (${m.age_range}): ${m.has_mobile_line ? '✓ has line' : '✗ no line'}`)
    })
    console.log()
  }

  console.log('🔮 Running prediction analysis...\n')

  try {
    const startTime = Date.now()
    const predictions = await analyzePurchaseIntent(customer.session_id)
    const endTime = Date.now()

    console.log(`✅ Analysis completed in ${endTime - startTime}ms\n`)

    if (predictions.length === 0) {
      console.log('ℹ️  No predictions generated (customer signals below threshold)\n')
    } else {
      console.log(`📈 Generated ${predictions.length} prediction(s):\n`)

      predictions.forEach((pred, i) => {
        console.log(`${i + 1}. ${pred.prediction_type.toUpperCase()}`)
        console.log(`   📊 Probability: ${(pred.probability_score * 100).toFixed(1)}%`)
        console.log(`   🎯 Confidence: ${pred.confidence}`)
        console.log(`   💡 Reasoning: ${pred.reasoning}`)
        console.log(`   ⚡ Actions:`)
        pred.recommended_actions.forEach((action: string) => {
          console.log(`      - ${action}`)
        })
        console.log()
      })
    }

    // Verify predictions were saved to database
    const { data: savedPredictions } = await supabase
      .from('purchase_predictions')
      .select('*')
      .eq('session_id', customer.session_id)

    console.log(`💾 Saved ${savedPredictions?.length || 0} predictions to database\n`)

  } catch (error) {
    console.error('❌ Prediction failed:', error)
    throw error
  }

  console.log('✅ Test completed successfully!')
}

testPredictionAPI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
