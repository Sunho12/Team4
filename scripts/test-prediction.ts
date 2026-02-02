import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPrediction() {
  console.log('🧪 Testing new prediction logic...\n')

  // Get a customer with full data
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
    console.log('❌ No customer found with demographics')
    return
  }

  console.log('📋 Testing customer:')
  console.log(`   Tier: ${customer.customer_tier}`)
  console.log(`   Age: ${customer.age_range}`)
  console.log(`   Plan: ${customer.current_plan_type}`)
  console.log(`   Usage: ${customer.average_monthly_usage_gb}GB\n`)

  // Get session info
  const { data: session } = await supabase
    .from('customer_sessions')
    .select('customer_name')
    .eq('id', customer.session_id)
    .single()

  console.log(`   Name: ${session?.customer_name}\n`)

  // Fetch all related data
  console.log('📊 Fetching customer data...')
  const [devices, purchases, family, conversations] = await Promise.all([
    supabase.from('customer_devices').select('*').eq('session_id', customer.session_id),
    supabase.from('purchase_history').select('*').eq('session_id', customer.session_id),
    supabase.from('family_members').select('*').eq('session_id', customer.session_id),
    supabase.from('conversations').select('*, conversation_summaries(*)').eq('session_id', customer.session_id)
  ])

  console.log(`   ✓ ${devices.data?.length || 0} devices`)
  console.log(`   ✓ ${purchases.data?.length || 0} purchases`)
  console.log(`   ✓ ${family.data?.length || 0} family members`)
  console.log(`   ✓ ${conversations.data?.length || 0} conversations\n`)

  // Show device info
  const currentDevice = devices.data?.find(d => d.is_current)
  if (currentDevice) {
    console.log('📱 Current device:')
    console.log(`   Model: ${currentDevice.model_name}`)
    console.log(`   Age: ${currentDevice.device_age_months} months`)
    console.log(`   Condition: ${currentDevice.condition}`)
    console.log(`   Battery: ${currentDevice.battery_health_percent}%\n`)
  }

  // Show conversation summary
  if (conversations.data && conversations.data.length > 0) {
    console.log('💬 Recent conversations:')
    conversations.data.slice(0, 3).forEach((c: any) => {
      const summary = c.conversation_summaries?.[0]
      if (summary) {
        console.log(`   - ${summary.category}: ${summary.sentiment}`)
        console.log(`     Keywords: ${summary.keywords?.join(', ') || 'none'}`)
      }
    })
    console.log()
  }

  // Get predictions
  console.log('🔮 Fetching predictions...')
  const { data: predictions } = await supabase
    .from('purchase_predictions')
    .select('*')
    .eq('session_id', customer.session_id)
    .order('probability_score', { ascending: false })

  if (!predictions || predictions.length === 0) {
    console.log('   ℹ️  No predictions found in database\n')
  } else {
    console.log(`\n📈 Found ${predictions.length} prediction(s):\n`)
    predictions.forEach((p: any, i: number) => {
      console.log(`${i + 1}. ${p.prediction_type.toUpperCase()}`)
      console.log(`   Probability: ${(p.probability_score * 100).toFixed(1)}%`)
      console.log(`   Confidence: ${p.confidence}`)
      console.log(`   Reasoning: ${p.reasoning}`)
      console.log(`   Actions: ${p.recommended_actions?.join(', ')}`)
      console.log()
    })
  }

  console.log('✅ Test completed!')
}

testPrediction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
