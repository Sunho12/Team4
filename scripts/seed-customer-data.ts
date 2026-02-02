import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuration
const CONFIG = {
  PURCHASES_PER_CUSTOMER_MIN: 3,
  PURCHASES_PER_CUSTOMER_MAX: 10,
  DEVICES_PER_CUSTOMER_MIN: 1,
  DEVICES_PER_CUSTOMER_MAX: 3,
  FAMILY_PROBABILITY: 0.4, // 40% 고객만 가족 구성원 있음
  FAMILY_MEMBERS_MAX: 5,
  APP_METRICS_DAYS: 90, // 최근 90일 데이터
}

// Data constants
const PLANS = [
  { name: '5G 프리미어', price: 80000, data: 'unlimited' },
  { name: '5G 스탠다드', price: 60000, data: '100GB' },
  { name: 'LTE 베이직', price: 40000, data: '50GB' },
  { name: 'LTE 라이트', price: 30000, data: '30GB' },
  { name: '5G 슬림', price: 50000, data: '80GB' },
]

const DEVICES = [
  { manufacturer: 'Samsung', models: ['Galaxy S24', 'Galaxy S23', 'Galaxy S22', 'Galaxy A54', 'Galaxy Z Flip 5'] },
  { manufacturer: 'Apple', models: ['iPhone 15 Pro', 'iPhone 15', 'iPhone 14', 'iPhone 13'] },
  { manufacturer: 'LG', models: ['LG V60', 'LG Velvet'] },
]

const SERVICES = [
  { name: '데이터 쉐어링', price: 5000 },
  { name: 'T-world 멤버십', price: 3000 },
  { name: '해외 로밍', price: 9900 },
  { name: '스마트 시큐리티', price: 7000 },
  { name: 'OTT 결합', price: 10000 },
]

const ACCESSORIES = [
  { name: '무선 이어폰', price: 150000 },
  { name: '보호 케이스', price: 30000 },
  { name: '화면 보호필름', price: 15000 },
  { name: '충전기', price: 50000 },
]

const FEATURES = [
  'plan_comparison',
  'bill_check',
  'data_usage_check',
  'device_browse',
  'chat',
  'roaming_info',
  'membership_benefits',
  'service_add',
]

const PAGES = [
  'home',
  'my_plan',
  'billing',
  'devices',
  'support',
  'membership',
  'events',
  'roaming',
]

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

function randomDate(startDaysAgo: number, endDaysAgo: number = 0): Date {
  const end = new Date()
  end.setDate(end.getDate() - endDaysAgo)
  const start = new Date()
  start.setDate(start.getDate() - startDaysAgo)
  const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  return new Date(timestamp)
}

// Generate functions
function generateDemographics(userId: string, index: number) {
  const tiers = ['bronze', 'silver', 'gold', 'vip']
  const ageRanges = ['20s', '30s', '40s', '50s', '60+']
  const genders = ['male', 'female', 'other']

  const tier = tiers[index % tiers.length]
  const ageRange = randomChoice(ageRanges)
  const plan = randomChoice(PLANS)

  // Subscription start date based on tier
  let subscriptionStartDaysAgo: number
  if (tier === 'vip') subscriptionStartDaysAgo = randomInt(1825, 3650) // 5-10 years
  else if (tier === 'gold') subscriptionStartDaysAgo = randomInt(730, 1825) // 2-5 years
  else if (tier === 'silver') subscriptionStartDaysAgo = randomInt(365, 730) // 1-2 years
  else subscriptionStartDaysAgo = randomInt(90, 365) // 3 months - 1 year

  const usageMultiplier = tier === 'vip' ? 1.5 : tier === 'gold' ? 1.2 : 1
  const averageUsage = randomInt(20, 150) * usageMultiplier

  return {
    user_id: userId,
    age_range: ageRange,
    gender: randomChoice(genders),
    customer_tier: tier,
    subscription_start_date: randomDate(subscriptionStartDaysAgo).toISOString(),
    current_plan_type: plan.name,
    current_plan_price: plan.price,
    average_monthly_usage_gb: averageUsage,
  }
}

function generatePurchaseHistory(userId: string, demographics: any): any[] {
  const purchases: any[] = []
  const count = randomInt(CONFIG.PURCHASES_PER_CUSTOMER_MIN, CONFIG.PURCHASES_PER_CUSTOMER_MAX)
  const subscriptionStart = new Date(demographics.subscription_start_date)
  const daysAgo = Math.floor((Date.now() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24))

  // Initial device purchase
  const deviceBrand = randomChoice(DEVICES)
  purchases.push({
    user_id: userId,
    purchase_type: 'device',
    product_name: randomChoice(deviceBrand.models),
    price: randomInt(600000, 1500000),
    purchase_date: randomDate(daysAgo, daysAgo - 30).toISOString(),
    contract_months: randomChoice([24, 30]),
    metadata: { manufacturer: deviceBrand.manufacturer },
  })

  // Plan changes
  const planChangeCount = randomInt(1, 3)
  for (let i = 0; i < planChangeCount; i++) {
    const plan = randomChoice(PLANS)
    purchases.push({
      user_id: userId,
      purchase_type: 'plan_change',
      product_name: plan.name,
      price: plan.price,
      purchase_date: randomDate(daysAgo, 0).toISOString(),
      contract_months: null,
      metadata: { data_limit: plan.data },
    })
  }

  // Add services
  const serviceCount = randomInt(1, 3)
  for (let i = 0; i < serviceCount; i++) {
    const service = randomChoice(SERVICES)
    purchases.push({
      user_id: userId,
      purchase_type: 'add_service',
      product_name: service.name,
      price: service.price,
      purchase_date: randomDate(daysAgo, 0).toISOString(),
      contract_months: null,
      metadata: null,
    })
  }

  // Accessories
  if (Math.random() > 0.5) {
    const accessory = randomChoice(ACCESSORIES)
    purchases.push({
      user_id: userId,
      purchase_type: 'accessory',
      product_name: accessory.name,
      price: accessory.price,
      purchase_date: randomDate(daysAgo, 0).toISOString(),
      contract_months: null,
      metadata: null,
    })
  }

  return purchases
}

function generateDevices(userId: string, purchaseHistory: any[]): any[] {
  const devicePurchases = purchaseHistory.filter(p => p.purchase_type === 'device')
  const devices: any[] = []

  devicePurchases.forEach((purchase, index) => {
    const isLatest = index === devicePurchases.length - 1
    devices.push({
      user_id: userId,
      device_type: 'smartphone',
      manufacturer: purchase.metadata?.manufacturer || 'Samsung',
      model_name: purchase.product_name,
      purchase_date: purchase.purchase_date,
      is_current: isLatest,
    })
  })

  // Add extra device if needed
  if (devices.length < CONFIG.DEVICES_PER_CUSTOMER_MIN) {
    const deviceBrand = randomChoice(DEVICES)
    devices.push({
      user_id: userId,
      device_type: randomChoice(['smartphone', 'tablet'] as const),
      manufacturer: deviceBrand.manufacturer,
      model_name: randomChoice(deviceBrand.models),
      purchase_date: randomDate(730, 365).toISOString(),
      is_current: false,
    })
  }

  return devices
}

function generateFamilyMembers(userId: string): any[] {
  if (Math.random() > CONFIG.FAMILY_PROBABILITY) {
    return [] // No family members
  }

  const members: any[] = []
  const memberCount = randomInt(1, CONFIG.FAMILY_MEMBERS_MAX)

  const relationships = ['spouse', 'child', 'parent', 'sibling']
  const ageRanges = ['child', 'teen', 'adult', 'senior']
  const lineTypes = ['prepaid', 'postpaid', 'shared_data']
  const usageLevels = ['low', 'medium', 'high']

  for (let i = 0; i < memberCount; i++) {
    const relationship = randomChoice(relationships)
    let ageRange: string

    if (relationship === 'child') ageRange = randomChoice(['child', 'teen'])
    else if (relationship === 'parent') ageRange = 'senior'
    else if (relationship === 'spouse') ageRange = 'adult'
    else ageRange = randomChoice(ageRanges)

    const hasMobileLine = Math.random() > 0.3

    members.push({
      user_id: userId,
      relationship,
      age_range: ageRange,
      has_mobile_line: hasMobileLine,
      line_type: hasMobileLine ? randomChoice(lineTypes) : null,
      data_usage_level: hasMobileLine ? randomChoice(usageLevels) : null,
    })
  }

  return members
}

function generateAppUsageMetrics(userId: string, demographics: any): any[] {
  const metrics: any[] = []
  const engagementLevel = demographics.customer_tier === 'vip' ? 'high'
    : demographics.customer_tier === 'gold' ? 'medium'
    : 'low'

  for (let daysAgo = CONFIG.APP_METRICS_DAYS; daysAgo >= 0; daysAgo--) {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)

    let sessionsCount: number
    let avgDuration: number

    if (engagementLevel === 'high') {
      sessionsCount = randomInt(3, 8)
      avgDuration = randomInt(180, 600)
    } else if (engagementLevel === 'medium') {
      sessionsCount = randomInt(1, 4)
      avgDuration = randomInt(120, 300)
    } else {
      sessionsCount = randomInt(0, 2)
      avgDuration = randomInt(60, 180)
    }

    // Skip some days randomly
    if (sessionsCount === 0 && Math.random() > 0.3) continue

    metrics.push({
      user_id: userId,
      metric_date: date.toISOString().split('T')[0],
      chatbot_sessions_count: sessionsCount,
      avg_session_duration_seconds: avgDuration,
      features_used: randomChoices(FEATURES, randomInt(1, 4)),
      pages_visited: randomChoices(PAGES, randomInt(2, 6)),
      search_queries: sessionsCount > 0 ? randomChoices(['요금제', '데이터', '로밍', '기기', '할인'], randomInt(0, 3)) : [],
      help_topics_viewed: sessionsCount > 0 ? randomChoices(['요금제 변경', '데이터 사용량', '해외 로밍'], randomInt(0, 2)) : [],
    })
  }

  return metrics
}

// Main seeding function
async function seedCustomerData() {
  console.log('🌱 고객 더미 데이터 생성 시작...\n')

  // Fetch all customer profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'customer')
    .order('created_at', { ascending: true })

  if (profileError || !profiles || profiles.length === 0) {
    console.error('❌ 고객 프로필을 찾을 수 없습니다:', profileError)
    return
  }

  console.log(`✅ ${profiles.length}명의 고객 프로필 발견\n`)

  const stats = {
    demographics: 0,
    purchases: 0,
    devices: 0,
    family: 0,
    metrics: 0,
  }

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i]
    console.log(`\n[${i + 1}/${profiles.length}] ${profile.full_name} 처리 중...`)

    try {
      // 1. Demographics
      const demographics = generateDemographics(profile.id, i)
      const { error: demoError } = await supabase
        .from('customer_demographics')
        .insert(demographics)

      if (demoError) {
        console.error(`  ❌ Demographics 오류:`, demoError.message)
      } else {
        stats.demographics++
        console.log(`  ✓ Demographics 생성`)
      }

      // 2. Purchase History
      const purchases = generatePurchaseHistory(profile.id, demographics)
      const { error: purchaseError } = await supabase
        .from('purchase_history')
        .insert(purchases)

      if (purchaseError) {
        console.error(`  ❌ Purchase History 오류:`, purchaseError.message)
      } else {
        stats.purchases += purchases.length
        console.log(`  ✓ Purchase History ${purchases.length}개 생성`)
      }

      // 3. Devices
      const devices = generateDevices(profile.id, purchases)
      const { error: deviceError } = await supabase
        .from('customer_devices')
        .insert(devices)

      if (deviceError) {
        console.error(`  ❌ Devices 오류:`, deviceError.message)
      } else {
        stats.devices += devices.length
        console.log(`  ✓ Devices ${devices.length}개 생성`)
      }

      // 4. Family Members
      const family = generateFamilyMembers(profile.id)
      if (family.length > 0) {
        const { error: familyError } = await supabase
          .from('family_members')
          .insert(family)

        if (familyError) {
          console.error(`  ❌ Family Members 오류:`, familyError.message)
        } else {
          stats.family += family.length
          console.log(`  ✓ Family Members ${family.length}개 생성`)
        }
      } else {
        console.log(`  ⊘ Family Members 없음`)
      }

      // 5. App Usage Metrics
      const metrics = generateAppUsageMetrics(profile.id, demographics)

      // Insert in batches to avoid timeout
      const batchSize = 50
      for (let j = 0; j < metrics.length; j += batchSize) {
        const batch = metrics.slice(j, j + batchSize)
        const { error: metricsError } = await supabase
          .from('app_usage_metrics')
          .insert(batch)

        if (metricsError) {
          console.error(`  ❌ App Metrics 오류 (batch ${Math.floor(j / batchSize) + 1}):`, metricsError.message)
          break
        }
      }

      stats.metrics += metrics.length
      console.log(`  ✓ App Usage Metrics ${metrics.length}개 생성`)

    } catch (error: any) {
      console.error(`  ❌ 처리 중 오류:`, error.message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 더미 데이터 생성 완료!\n')
  console.log('📊 생성 통계:')
  console.log(`  - Customer Demographics: ${stats.demographics}개`)
  console.log(`  - Purchase History: ${stats.purchases}개`)
  console.log(`  - Customer Devices: ${stats.devices}개`)
  console.log(`  - Family Members: ${stats.family}개`)
  console.log(`  - App Usage Metrics: ${stats.metrics}개`)
  console.log('='.repeat(60))
}

seedCustomerData()
  .then(() => {
    console.log('\n✨ 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 치명적 오류:', error)
    process.exit(1)
  })
