import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Configuration
const CONFIG = {
  NUM_CUSTOMERS: 25,
  CONVERSATIONS_PER_CUSTOMER_MIN: 3,
  CONVERSATIONS_PER_CUSTOMER_MAX: 8,
  MESSAGES_PER_CONVERSATION_MIN: 4,
  MESSAGES_PER_CONVERSATION_MAX: 12,
  GENERATE_LAST_N_MONTHS: 3,
  USE_RULE_BASED_PREDICTIONS: true,
}

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Type definitions
interface CustomerProfile {
  sessionId: string
  sessionToken: string
  customerName: string
  customerPhone: string
  profileType: 'young_professional' | 'family_head' | 'senior' | 'student' | 'vip'
  createdAt: Date
}

interface Demographics {
  sessionId: string
  ageRange: '20s' | '30s' | '40s' | '50s' | '60+'
  gender: 'male' | 'female' | 'other'
  occupation: string
  incomeRange: 'low' | 'medium' | 'high' | 'very_high'
  residentialArea: string
  customerTier: 'bronze' | 'silver' | 'gold' | 'vip'
  subscriptionStartDate: Date
  currentPlanType: string
  currentPlanPrice: number
  averageMonthlyUsageGb: number
}

interface PurchaseRecord {
  sessionId: string
  purchaseType: 'device' | 'plan_change' | 'add_service' | 'accessory'
  productName: string
  price: number
  purchaseDate: Date
  contractMonths?: number
  metadata?: any
}

interface FamilyMember {
  sessionId: string
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
  ageRange: 'child' | 'teen' | 'adult' | 'senior'
  hasMobileLine: boolean
  lineType?: 'prepaid' | 'postpaid' | 'shared_data'
  dataUsageLevel?: 'low' | 'medium' | 'high'
}

interface Device {
  sessionId: string
  deviceType: 'smartphone' | 'tablet' | 'wearable' | 'other'
  manufacturer: string
  modelName: string
  purchaseDate: Date
  isCurrent: boolean
  deviceAgeMonths: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  batteryHealthPercent?: number
}

interface ConversationTemplate {
  category: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  keywords: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface UsageMetric {
  sessionId: string
  metricDate: Date
  chatbotSessionsCount: number
  avgSessionDurationSeconds: number
  featuresUsed: string[]
  pagesVisited: string[]
  searchQueries: string[]
  helpTopicsViewed: string[]
}

// Data constants
const KOREAN_NAMES = [
  '김민수', '이지은', '박서준', '최영희', '정다은',
  '강호동', '윤아라', '임수정', '배성훈', '송지효',
  '조인성', '한지민', '신동엽', '김태희', '이민호',
  '박보영', '최민식', '전지현', '유재석', '이나영',
  '김수현', '손예진', '정우성', '이영애', '권상우',
]

const OCCUPATIONS = [
  '회사원', '공무원', '자영업', '전문직', '학생',
  '주부', '교사', '의사', '변호사', '프리랜서',
  '엔지니어', '디자이너', '마케터', '연구원', '무직',
]

const RESIDENTIAL_AREAS = [
  '서울', '경기도', '인천', '부산', '대구',
  '광주', '대전', '울산', '세종', '강원도',
  '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주도',
]

const DEVICES = [
  { manufacturer: 'Samsung', models: ['Galaxy S24', 'Galaxy S23', 'Galaxy S22', 'Galaxy A54', 'Galaxy A34', 'Galaxy Z Flip 5'] },
  { manufacturer: 'Apple', models: ['iPhone 15 Pro', 'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone SE'] },
  { manufacturer: 'LG', models: ['LG V60', 'LG Velvet', 'LG Wing'] },
]

const PLANS = [
  { name: '5G 프리미어', price: 80000, data: 'unlimited' },
  { name: '5G 스탠다드', price: 60000, data: '100GB' },
  { name: 'LTE 베이직', price: 40000, data: '50GB' },
  { name: 'LTE 라이트', price: 30000, data: '30GB' },
  { name: '5G 슬림', price: 50000, data: '80GB' },
]

const SERVICES = [
  { name: '데이터 쉐어링', price: 5000 },
  { name: 'T-world 멤버십', price: 3000 },
  { name: '해외 로밍', price: 9900 },
  { name: '스마트 시큐리티', price: 7000 },
  { name: 'OTT 결합', price: 10000 },
]

const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  // Plan change templates (high intent)
  {
    category: 'plan_change',
    messages: [
      { role: 'user', content: '5G 요금제로 변경하고 싶어요' },
      { role: 'assistant', content: '현재 데이터를 얼마나 사용하시나요?' },
      { role: 'user', content: '한 달에 50GB 정도요' },
      { role: 'assistant', content: '5G 스탠다드 플랜(월 60,000원, 100GB)이 적합합니다' },
      { role: 'user', content: '신청 어떻게 하나요?' },
      { role: 'assistant', content: '114로 연락주시거나 T-world 앱에서 변경 가능합니다' },
    ],
    keywords: ['요금제', '변경', '5G', '신청'],
    sentiment: 'positive',
  },
  {
    category: 'plan_change',
    messages: [
      { role: 'user', content: '요금제가 너무 비싼 것 같아요' },
      { role: 'assistant', content: '현재 어떤 요금제를 사용 중이신가요?' },
      { role: 'user', content: '5G 프리미어인데 데이터를 많이 안 써요' },
      { role: 'assistant', content: '월 사용량이 적으시다면 5G 슬림(50,000원)이나 LTE 베이직(40,000원)으로 변경하시면 절약하실 수 있습니다' },
      { role: 'user', content: '그럼 바꿔볼게요' },
    ],
    keywords: ['요금제', '비싸', '변경', '절약'],
    sentiment: 'neutral',
  },
  // Device upgrade templates
  {
    category: 'device_upgrade',
    messages: [
      { role: 'user', content: '새 휴대폰으로 바꾸고 싶어요' },
      { role: 'assistant', content: '현재 사용 중인 기기가 어떻게 되시나요?' },
      { role: 'user', content: 'Galaxy S22를 2년 넘게 썼어요' },
      { role: 'assistant', content: '2년 약정 시 Galaxy S24를 최대 30% 할인받으실 수 있습니다' },
      { role: 'user', content: '할인 받고 싶네요' },
      { role: 'assistant', content: '가까운 매장 방문하시거나 114로 연락주시면 상세히 안내해드리겠습니다' },
    ],
    keywords: ['기기변경', '휴대폰', '할인', '약정'],
    sentiment: 'positive',
  },
  {
    category: 'device_upgrade',
    messages: [
      { role: 'user', content: '아이폰 15 할인 얼마나 되나요?' },
      { role: 'assistant', content: '2년 약정 시 최대 25% 할인이 가능합니다' },
      { role: 'user', content: '분할 납부도 되나요?' },
      { role: 'assistant', content: '네, 24개월 또는 30개월 무이자 할부가 가능합니다' },
      { role: 'user', content: '생각해보고 연락할게요' },
    ],
    keywords: ['아이폰', '할인', '기기변경', '분할납부'],
    sentiment: 'neutral',
  },
  {
    category: 'device_upgrade',
    messages: [
      { role: 'user', content: '배터리가 너무 빨리 닳아요' },
      { role: 'assistant', content: '현재 기기를 얼마나 사용하셨나요?' },
      { role: 'user', content: '3년 정도 됐어요' },
      { role: 'assistant', content: '배터리 교체 서비스를 이용하시거나 새 기기로 변경하실 수 있습니다. 현재 신규 기기 할인 이벤트 진행 중입니다' },
      { role: 'user', content: '새 폰으로 바꿔볼까요' },
    ],
    keywords: ['배터리', '기기변경', '할인'],
    sentiment: 'neutral',
  },
  // Billing inquiry templates
  {
    category: 'billing_inquiry',
    messages: [
      { role: 'user', content: '이번 달 요금이 왜 이렇게 많이 나왔죠?' },
      { role: 'assistant', content: '요금 내역을 확인해드리겠습니다. 추가 데이터 사용이나 부가 서비스 이용이 있으셨나요?' },
      { role: 'user', content: '해외 여행 갔을 때 로밍 썼어요' },
      { role: 'assistant', content: '해외 로밍 요금이 추가되었습니다. 다음에는 로밍 패키지를 미리 가입하시면 저렴합니다' },
    ],
    keywords: ['요금', '비싸', '로밍', '추가'],
    sentiment: 'negative',
  },
  {
    category: 'billing_inquiry',
    messages: [
      { role: 'user', content: '요금 조회 어떻게 하나요?' },
      { role: 'assistant', content: 'T-world 앱에서 실시간으로 확인 가능하시고, 114로 연락주셔도 됩니다' },
      { role: 'user', content: '앱에서 볼게요. 감사합니다' },
    ],
    keywords: ['요금', '조회', '앱'],
    sentiment: 'positive',
  },
  // Technical support templates
  {
    category: 'technical_support',
    messages: [
      { role: 'user', content: '데이터가 안 터져요' },
      { role: 'assistant', content: '현재 위치가 어디신가요? 실내이신가요?' },
      { role: 'user', content: '집 안인데 갑자기 안 돼요' },
      { role: 'assistant', content: '기기를 재부팅해보시고, 비행기 모드를 켰다 꺼보세요. 그래도 안 되면 114로 연락주세요' },
      { role: 'user', content: '재부팅했더니 되네요. 감사합니다' },
    ],
    keywords: ['데이터', '문제', '기술지원'],
    sentiment: 'neutral',
  },
  {
    category: 'technical_support',
    messages: [
      { role: 'user', content: '5G가 LTE보다 느린 것 같아요' },
      { role: 'assistant', content: '현재 위치의 5G 커버리지를 확인해드리겠습니다. 지역이 어디신가요?' },
      { role: 'user', content: '서울 강남이요' },
      { role: 'assistant', content: '강남 지역은 5G 커버리지가 좋은 편입니다. 속도 테스트를 해보시고, 문제가 지속되면 기술 지원팀에 연결해드리겠습니다' },
    ],
    keywords: ['5G', '속도', '기술지원'],
    sentiment: 'neutral',
  },
  // Add service templates
  {
    category: 'add_service',
    messages: [
      { role: 'user', content: '가족끼리 데이터 공유 되나요?' },
      { role: 'assistant', content: '네, 데이터 쉐어링 서비스를 이용하시면 가능합니다' },
      { role: 'user', content: '비용이 얼마나 드나요?' },
      { role: 'assistant', content: '월 5,000원이고 최대 5명까지 등록 가능합니다' },
      { role: 'user', content: '신청하고 싶어요' },
    ],
    keywords: ['데이터 쉐어링', '부가서비스', '가족', '신청'],
    sentiment: 'positive',
  },
  {
    category: 'add_service',
    messages: [
      { role: 'user', content: 'OTT 서비스 결합 상품 있나요?' },
      { role: 'assistant', content: '넷플릭스, 디즈니+ 등 다양한 OTT 결합 상품이 있습니다' },
      { role: 'user', content: '얼마나 할인되나요?' },
      { role: 'assistant', content: '결합 시 월 1만원에 이용 가능하고, 별도 가입 대비 30% 저렴합니다' },
    ],
    keywords: ['OTT', '결합', '부가서비스', '할인'],
    sentiment: 'positive',
  },
  // General inquiry templates
  {
    category: 'general_inquiry',
    messages: [
      { role: 'user', content: '고객센터 전화번호가 뭐죠?' },
      { role: 'assistant', content: '114번으로 연락주시면 됩니다. 24시간 운영됩니다' },
      { role: 'user', content: '감사합니다' },
    ],
    keywords: ['고객센터', '전화번호'],
    sentiment: 'neutral',
  },
  {
    category: 'general_inquiry',
    messages: [
      { role: 'user', content: 'T-world 멤버십 혜택이 뭐가 있나요?' },
      { role: 'assistant', content: '통신요금 결제 시 포인트 적립되고, 포인트로 요금 할인이나 상품 구매가 가능합니다' },
      { role: 'user', content: '적립 비율은요?' },
      { role: 'assistant', content: '1만원당 100포인트 적립됩니다' },
    ],
    keywords: ['멤버십', '포인트', '혜택'],
    sentiment: 'positive',
  },
  // Churn risk templates
  {
    category: 'plan_change',
    messages: [
      { role: 'user', content: '타사 요금제가 더 저렴한 것 같은데요' },
      { role: 'assistant', content: '현재 어떤 요금제를 비교하고 계신가요?' },
      { role: 'user', content: '타사에서 5G 무제한을 7만원에 준대요' },
      { role: 'assistant', content: '저희도 장기 고객 할인과 결합 할인 적용 시 비슷한 가격으로 이용 가능합니다. 상담 연결해드릴까요?' },
      { role: 'user', content: '생각해볼게요' },
    ],
    keywords: ['타사', '비교', '요금제', '번호이동'],
    sentiment: 'negative',
  },
  {
    category: 'billing_inquiry',
    messages: [
      { role: 'user', content: '해지하려고 하는데 어떻게 하나요?' },
      { role: 'assistant', content: '불편하신 점이 있으셨나요? 도움을 드릴 수 있을까요?' },
      { role: 'user', content: '요금이 너무 비싸요' },
      { role: 'assistant', content: '더 저렴한 요금제로 변경하시거나 할인 혜택을 받으실 수 있습니다. 상담원 연결해드릴까요?' },
      { role: 'user', content: '아니요, 괜찮습니다' },
    ],
    keywords: ['해지', '번호이동', '요금', '비싸'],
    sentiment: 'negative',
  },
]

// Helper functions
function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomDate(startDate: Date, endDate: Date): Date {
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() - months)
  return result
}

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

// Main seeder class
class PredictionDataSeeder {
  private customerProfiles: CustomerProfile[] = []

  // Generate customer profiles
  private generateCustomerProfiles(count: number): CustomerProfile[] {
    const profiles: CustomerProfile[] = []
    const profileTypes: CustomerProfile['profileType'][] = [
      'young_professional', 'family_head', 'senior', 'student', 'vip',
    ]

    const now = new Date()

    for (let i = 0; i < count; i++) {
      const profileType = profileTypes[i % profileTypes.length]
      const name = KOREAN_NAMES[i % KOREAN_NAMES.length]
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(7)

      profiles.push({
        sessionId: '', // Will be filled after insertion
        sessionToken: `customer-${timestamp}-${randomSuffix}`,
        customerName: name,
        customerPhone: `010-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        profileType,
        createdAt: randomDate(subtractMonths(now, 12), subtractMonths(now, 6)),
      })
    }

    return profiles
  }

  // Generate demographics based on profile
  private generateDemographics(profile: CustomerProfile): Demographics {
    let ageRange: Demographics['ageRange']
    let customerTier: Demographics['customerTier']
    let incomeRange: Demographics['incomeRange']
    let averageMonthlyUsageGb: number
    let currentPlan: typeof PLANS[0]

    switch (profile.profileType) {
      case 'young_professional':
        ageRange = Math.random() > 0.5 ? '20s' : '30s'
        customerTier = Math.random() > 0.5 ? 'silver' : 'gold'
        incomeRange = Math.random() > 0.3 ? 'high' : 'medium'
        averageMonthlyUsageGb = randomFloat(80, 150)
        currentPlan = random([PLANS[0], PLANS[1]]) // Premium plans
        break
      case 'family_head':
        ageRange = Math.random() > 0.5 ? '40s' : '50s'
        customerTier = Math.random() > 0.6 ? 'gold' : 'silver'
        incomeRange = Math.random() > 0.4 ? 'high' : 'medium'
        averageMonthlyUsageGb = randomFloat(30, 80)
        currentPlan = random([PLANS[1], PLANS[2]]) // Mid-tier plans
        break
      case 'senior':
        ageRange = '60+'
        customerTier = Math.random() > 0.7 ? 'gold' : 'silver'
        incomeRange = 'medium'
        averageMonthlyUsageGb = randomFloat(5, 20)
        currentPlan = random([PLANS[2], PLANS[3]]) // Basic plans
        break
      case 'student':
        ageRange = '20s'
        customerTier = 'bronze'
        incomeRange = 'low'
        averageMonthlyUsageGb = randomFloat(60, 120)
        currentPlan = random([PLANS[3], PLANS[4]]) // Budget plans
        break
      case 'vip':
        ageRange = random(['30s', '40s', '50s'] as Demographics['ageRange'][])
        customerTier = 'vip'
        incomeRange = 'very_high'
        averageMonthlyUsageGb = randomFloat(100, 200)
        currentPlan = PLANS[0] // Premium plan
        break
      default:
        ageRange = '30s'
        customerTier = 'silver'
        incomeRange = 'medium'
        averageMonthlyUsageGb = randomFloat(40, 80)
        currentPlan = PLANS[1]
    }

    const subscriptionYearsAgo = customerTier === 'vip' ? randomInt(5, 10) :
                                  customerTier === 'gold' ? randomInt(2, 5) :
                                  customerTier === 'silver' ? randomInt(1, 2) :
                                  randomFloat(0.1, 1)

    return {
      sessionId: profile.sessionId,
      ageRange,
      gender: random(['male', 'female'] as Demographics['gender'][]),
      occupation: random(OCCUPATIONS),
      incomeRange,
      residentialArea: random(RESIDENTIAL_AREAS),
      customerTier,
      subscriptionStartDate: subtractMonths(new Date(), Math.floor(subscriptionYearsAgo * 12)),
      currentPlanType: currentPlan.name,
      currentPlanPrice: currentPlan.price,
      averageMonthlyUsageGb,
    }
  }

  // Generate purchase history
  private generatePurchaseHistory(profile: CustomerProfile, demographics: Demographics): PurchaseRecord[] {
    const purchases: PurchaseRecord[] = []
    const now = new Date()
    const subscriptionStart = demographics.subscriptionStartDate

    // Device purchases (every 24-36 months)
    const deviceUpgradeCycle = randomInt(24, 36)
    let lastDevicePurchase = subscriptionStart

    while (lastDevicePurchase < now) {
      const deviceManufacturer = random(DEVICES)
      const deviceModel = random(deviceManufacturer.models)

      purchases.push({
        sessionId: profile.sessionId,
        purchaseType: 'device',
        productName: deviceModel,
        price: randomInt(800000, 1500000),
        purchaseDate: lastDevicePurchase,
        contractMonths: 24,
        metadata: { manufacturer: deviceManufacturer.manufacturer, color: random(['Black', 'White', 'Blue', 'Pink']) },
      })

      lastDevicePurchase = subtractMonths(lastDevicePurchase, -deviceUpgradeCycle)
    }

    // Plan changes (every 6-18 months)
    const planChanges = randomInt(1, 4)
    for (let i = 0; i < planChanges; i++) {
      const changeDate = randomDate(subscriptionStart, now)
      const plan = random(PLANS)

      purchases.push({
        sessionId: profile.sessionId,
        purchaseType: 'plan_change',
        productName: plan.name,
        price: plan.price,
        purchaseDate: changeDate,
        contractMonths: 12,
      })
    }

    // Add services (occasional)
    if (Math.random() > 0.5) {
      const serviceCount = randomInt(1, 3)
      for (let i = 0; i < serviceCount; i++) {
        const service = random(SERVICES)
        purchases.push({
          sessionId: profile.sessionId,
          purchaseType: 'add_service',
          productName: service.name,
          price: service.price,
          purchaseDate: randomDate(subscriptionStart, now),
        })
      }
    }

    // Accessories (random)
    if (Math.random() > 0.7) {
      purchases.push({
        sessionId: profile.sessionId,
        purchaseType: 'accessory',
        productName: random(['무선 이어폰', '스마트 워치', '보호 케이스', '충전기']),
        price: randomInt(30000, 200000),
        purchaseDate: randomDate(subscriptionStart, now),
      })
    }

    return purchases.sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime())
  }

  // Generate family members
  private generateFamilyMembers(profile: CustomerProfile, demographics: Demographics): FamilyMember[] {
    const members: FamilyMember[] = []

    // Family head profiles get family members
    if (profile.profileType === 'family_head' || (demographics.ageRange === '40s' && Math.random() > 0.5)) {
      // Spouse
      if (Math.random() > 0.3) {
        members.push({
          sessionId: profile.sessionId,
          relationship: 'spouse',
          ageRange: 'adult',
          hasMobileLine: Math.random() > 0.2,
          lineType: random(['postpaid', 'shared_data']),
          dataUsageLevel: random(['low', 'medium']),
        })
      }

      // Children
      const childrenCount = randomInt(1, 3)
      for (let i = 0; i < childrenCount; i++) {
        const age = random(['child', 'teen', 'adult'] as FamilyMember['ageRange'][])
        members.push({
          sessionId: profile.sessionId,
          relationship: 'child',
          ageRange: age,
          hasMobileLine: age === 'child' ? false : Math.random() > 0.4,
          lineType: age === 'teen' ? 'shared_data' : 'postpaid',
          dataUsageLevel: age === 'teen' ? 'high' : 'medium',
        })
      }
    }

    // Young professionals might have elderly parents
    if (profile.profileType === 'young_professional' && Math.random() > 0.6) {
      const parentCount = randomInt(1, 2)
      for (let i = 0; i < parentCount; i++) {
        members.push({
          sessionId: profile.sessionId,
          relationship: 'parent',
          ageRange: 'senior',
          hasMobileLine: Math.random() > 0.5,
          lineType: 'postpaid',
          dataUsageLevel: 'low',
        })
      }
    }

    return members
  }

  // Generate devices
  private generateDevices(profile: CustomerProfile, purchaseHistory: PurchaseRecord[]): Device[] {
    const devices: Device[] = []
    const devicePurchases = purchaseHistory.filter(p => p.purchaseType === 'device')
    const now = new Date()

    devicePurchases.forEach((purchase, index) => {
      const isCurrent = index === devicePurchases.length - 1
      const ageMonths = Math.floor((now.getTime() - purchase.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

      let condition: Device['condition']
      let batteryHealth: number | undefined

      if (ageMonths < 12) {
        condition = 'excellent'
        batteryHealth = randomInt(95, 100)
      } else if (ageMonths < 24) {
        condition = 'good'
        batteryHealth = randomInt(85, 95)
      } else if (ageMonths < 36) {
        condition = 'fair'
        batteryHealth = randomInt(70, 85)
      } else {
        condition = 'poor'
        batteryHealth = randomInt(50, 70)
      }

      devices.push({
        sessionId: profile.sessionId,
        deviceType: 'smartphone',
        manufacturer: purchase.metadata?.manufacturer || 'Samsung',
        modelName: purchase.productName,
        purchaseDate: purchase.purchaseDate,
        isCurrent,
        deviceAgeMonths: ageMonths,
        condition,
        batteryHealthPercent: isCurrent ? batteryHealth : undefined,
      })
    })

    return devices
  }

  // Generate conversations
  private generateConversations(profile: CustomerProfile, demographics: Demographics, purchaseHistory: PurchaseRecord[]): any[] {
    const conversations: any[] = []
    const now = new Date()
    const conversationCount = randomInt(
      CONFIG.CONVERSATIONS_PER_CUSTOMER_MIN,
      CONFIG.CONVERSATIONS_PER_CUSTOMER_MAX
    )

    const startDate = subtractMonths(now, CONFIG.GENERATE_LAST_N_MONTHS)

    // Determine conversation patterns based on profile
    let templateWeights: Record<string, number> = {
      plan_change: 0.25,
      device_upgrade: 0.25,
      billing_inquiry: 0.20,
      technical_support: 0.15,
      add_service: 0.10,
      general_inquiry: 0.05,
    }

    // Adjust based on profile type
    if (profile.profileType === 'young_professional') {
      templateWeights.device_upgrade = 0.35
      templateWeights.plan_change = 0.20
    } else if (profile.profileType === 'family_head') {
      templateWeights.add_service = 0.25
      templateWeights.plan_change = 0.30
    } else if (profile.profileType === 'senior') {
      templateWeights.technical_support = 0.30
      templateWeights.general_inquiry = 0.15
    }

    for (let i = 0; i < conversationCount; i++) {
      // Select template based on weights
      const rand = Math.random()
      let cumulative = 0
      let selectedCategory = 'general_inquiry'

      for (const [category, weight] of Object.entries(templateWeights)) {
        cumulative += weight
        if (rand <= cumulative) {
          selectedCategory = category
          break
        }
      }

      const templates = CONVERSATION_TEMPLATES.filter(t => t.category === selectedCategory)
      const template = random(templates)

      const conversationDate = randomDate(startDate, now)

      conversations.push({
        profile,
        template,
        conversationDate,
      })
    }

    return conversations.sort((a, b) => a.conversationDate.getTime() - b.conversationDate.getTime())
  }

  // Generate app usage metrics
  private generateAppUsageMetrics(
    profile: CustomerProfile,
    demographics: Demographics,
    conversations: any[]
  ): UsageMetric[] {
    const metrics: UsageMetric[] = []
    const now = new Date()
    const startDate = subtractMonths(now, CONFIG.GENERATE_LAST_N_MONTHS)

    // Determine engagement level
    let engagementLevel: 'low' | 'medium' | 'high'
    if (demographics.customerTier === 'vip' || profile.profileType === 'young_professional') {
      engagementLevel = 'high'
    } else if (demographics.customerTier === 'bronze' || profile.profileType === 'senior') {
      engagementLevel = 'low'
    } else {
      engagementLevel = 'medium'
    }

    const features = [
      'plan_comparison', 'bill_check', 'data_usage_check', 'plan_change',
      'device_browse', 'chat', 'customer_support', 'membership_points', 'roaming_info',
    ]

    const pages = [
      'home', 'my_plan', 'billing', 'devices', 'support', 'membership', 'events',
    ]

    // Generate daily metrics
    for (let date = new Date(startDate); date <= now; date = subtractDays(date, -1)) {
      let sessionsCount = 0
      let avgDuration = 0
      let featuresUsed: string[] = []
      let pagesVisited: string[] = []
      let searchQueries: string[] = []
      let helpTopics: string[] = []

      // Check if there's a conversation on this day
      const conversationOnDay = conversations.find(c => {
        const cDate = new Date(c.conversationDate)
        return cDate.toDateString() === date.toDateString()
      })

      if (conversationOnDay) {
        // High activity on conversation days
        sessionsCount = randomInt(2, 5)
        avgDuration = randomInt(180, 300)
        featuresUsed = ['chat', random(features), random(features)]
        pagesVisited = ['home', 'my_plan', random(pages)]
      } else {
        // Regular activity based on engagement level
        if (engagementLevel === 'high') {
          if (Math.random() > 0.3) {
            sessionsCount = randomInt(1, 3)
            avgDuration = randomInt(120, 240)
            featuresUsed = [random(features), random(features)]
            pagesVisited = ['home', random(pages)]
          }
        } else if (engagementLevel === 'medium') {
          if (Math.random() > 0.6) {
            sessionsCount = randomInt(1, 2)
            avgDuration = randomInt(60, 180)
            featuresUsed = [random(features)]
            pagesVisited = ['home']
          }
        } else {
          if (Math.random() > 0.8) {
            sessionsCount = 1
            avgDuration = randomInt(30, 90)
            featuresUsed = [random(features)]
            pagesVisited = ['home']
          }
        }
      }

      if (sessionsCount > 0) {
        metrics.push({
          sessionId: profile.sessionId,
          metricDate: new Date(date),
          chatbotSessionsCount: sessionsCount,
          avgSessionDurationSeconds: avgDuration,
          featuresUsed: [...new Set(featuresUsed)],
          pagesVisited: [...new Set(pagesVisited)],
          searchQueries,
          helpTopicsViewed: helpTopics,
        })
      }
    }

    return metrics
  }

  // Rule-based prediction engine
  private generateRuleBasedPrediction(
    profile: CustomerProfile,
    demographics: Demographics,
    purchaseHistory: PurchaseRecord[],
    devices: Device[],
    familyMembers: FamilyMember[],
    conversations: any[]
  ): any[] {
    const predictions: any[] = []
    const now = new Date()

    // Device upgrade prediction
    const currentDevice = devices.find(d => d.isCurrent)
    if (currentDevice) {
      let score = 0

      if (currentDevice.deviceAgeMonths >= 24) score += 0.3
      if (currentDevice.deviceAgeMonths >= 30) score += 0.2
      if (currentDevice.batteryHealthPercent && currentDevice.batteryHealthPercent < 80) score += 0.15

      const deviceUpgradeConversations = conversations.filter(c => c.template.category === 'device_upgrade')
      score += deviceUpgradeConversations.length * 0.2

      if (currentDevice.condition === 'poor' || currentDevice.condition === 'fair') score += 0.1

      if (score >= 0.6) {
        const confidence = score >= 0.7 ? 'high' : 'medium'
        predictions.push({
          session_id: profile.sessionId,
          prediction_type: 'device_upgrade',
          probability_score: Math.min(score, 0.99),
          confidence,
          reasoning: `고객의 기기 사용 기간(${currentDevice.deviceAgeMonths}개월)과 배터리 상태(${currentDevice.batteryHealthPercent}%)를 고려할 때 기기 변경 가능성이 높습니다.`,
          recommended_actions: ['기기 할인 쿠폰 발송', '신제품 출시 알림', '매장 방문 예약 안내'],
        })
      }
    }

    // Plan change prediction
    let planScore = 0

    const usageRatio = demographics.averageMonthlyUsageGb / (
      demographics.currentPlanType.includes('무제한') ? 200 :
      parseInt(demographics.currentPlanType.match(/\d+/)?.[0] || '50')
    )

    if (usageRatio > 0.9) planScore += 0.3
    if (usageRatio < 0.3) planScore += 0.25

    const planChangeConversations = conversations.filter(c => c.template.category === 'plan_change')
    planScore += planChangeConversations.length * 0.2

    const billingComplaints = conversations.filter(c =>
      c.template.sentiment === 'negative' && c.template.category === 'billing_inquiry'
    )
    planScore += billingComplaints.length * 0.15

    if (planScore >= 0.5) {
      const confidence = planScore >= 0.7 ? 'high' : 'medium'
      predictions.push({
        session_id: profile.sessionId,
        prediction_type: 'plan_change',
        probability_score: Math.min(planScore, 0.99),
        confidence,
        reasoning: usageRatio > 0.9 ?
          '데이터 사용량이 요금제 한도에 근접하여 더 큰 요금제로 변경이 필요할 수 있습니다.' :
          '데이터 사용량이 낮아 더 저렴한 요금제로 변경 시 요금 절약이 가능합니다.',
        recommended_actions: ['요금제 맞춤 추천', '데이터 추가 할인 제안', '상담 전화 연결'],
      })
    }

    // Add service prediction
    let serviceScore = 0

    const familyWithoutLines = familyMembers.filter(m => !m.hasMobileLine && m.ageRange !== 'child')
    serviceScore += familyWithoutLines.length * 0.2

    if (demographics.averageMonthlyUsageGb > 100 && !purchaseHistory.find(p => p.productName.includes('데이터 쉐어링'))) {
      serviceScore += 0.25
    }

    const addServiceConversations = conversations.filter(c => c.template.category === 'add_service')
    serviceScore += addServiceConversations.length * 0.2

    if (demographics.customerTier === 'vip') serviceScore += 0.1

    if (serviceScore >= 0.5) {
      const confidence = serviceScore >= 0.7 ? 'high' : 'medium'
      predictions.push({
        session_id: profile.sessionId,
        prediction_type: 'add_service',
        probability_score: Math.min(serviceScore, 0.99),
        confidence,
        reasoning: familyWithoutLines.length > 0 ?
          '가족 구성원 중 회선이 없는 분들이 계셔서 데이터 쉐어링이나 추가 회선 개통을 고려할 수 있습니다.' :
          '높은 데이터 사용량과 고객 등급을 고려할 때 부가서비스 가입 가능성이 있습니다.',
        recommended_actions: ['가족 데이터 쉐어링 안내', '멤버십 혜택 소개', '부가서비스 무료 체험'],
      })
    }

    // Churn prevention
    let churnScore = 0

    const negativeConversations = conversations.filter(c => c.template.sentiment === 'negative')
    churnScore += negativeConversations.length * 0.3

    const churnKeywords = conversations.filter(c =>
      c.template.keywords.some((k: string) => ['타사', '번호이동', '해지'].includes(k))
    )
    churnScore += churnKeywords.length * 0.4

    const lastConversation = conversations[conversations.length - 1]
    if (lastConversation) {
      const daysSinceLastContact = Math.floor(
        (now.getTime() - new Date(lastConversation.conversationDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceLastContact > 90) churnScore += 0.2
    }

    if (churnScore >= 0.7) {
      predictions.push({
        session_id: profile.sessionId,
        prediction_type: 'churn_prevention',
        probability_score: Math.min(churnScore, 0.99),
        confidence: 'high',
        reasoning: '부정적인 상담 이력과 타사 전환 언급으로 인해 이탈 위험이 높습니다.',
        recommended_actions: ['고객 만족도 조사', 'VIP 혜택 제공', '긴급 상담 요청'],
      })
    }

    return predictions
  }

  // Database seeding methods
  async seedCustomerSessions(): Promise<CustomerProfile[]> {
    console.log('📊 Phase 1: Creating customer sessions...')

    this.customerProfiles = this.generateCustomerProfiles(CONFIG.NUM_CUSTOMERS)

    for (const profile of this.customerProfiles) {
      const { data, error } = await supabase
        .from('customer_sessions')
        .insert({
          session_token: profile.sessionToken,
          customer_name: profile.customerName,
          customer_phone: profile.customerPhone,
          created_at: profile.createdAt.toISOString(),
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error inserting customer session:', error)
        throw error
      }

      profile.sessionId = data.id
    }

    console.log(`✓ Created ${this.customerProfiles.length} customer sessions`)
    return this.customerProfiles
  }

  async seedDemographics(profiles: CustomerProfile[]): Promise<void> {
    console.log('📊 Phase 2a: Adding customer demographics...')

    for (const profile of profiles) {
      const demographics = this.generateDemographics(profile)

      const { error } = await supabase.from('customer_demographics').insert({
        session_id: demographics.sessionId,
        age_range: demographics.ageRange,
        gender: demographics.gender,
        occupation: demographics.occupation,
        income_range: demographics.incomeRange,
        residential_area: demographics.residentialArea,
        customer_tier: demographics.customerTier,
        subscription_start_date: demographics.subscriptionStartDate.toISOString(),
        current_plan_type: demographics.currentPlanType,
        current_plan_price: demographics.currentPlanPrice,
        average_monthly_usage_gb: demographics.averageMonthlyUsageGb,
      })

      if (error) {
        console.error('Error inserting demographics:', error)
        throw error
      }
    }

    console.log(`✓ Added demographics for ${profiles.length} customers`)
  }

  async seedPurchaseHistoryAndDevices(profiles: CustomerProfile[]): Promise<void> {
    console.log('📊 Phase 3: Generating purchase history and devices...')

    let totalPurchases = 0
    let totalDevices = 0

    for (const profile of profiles) {
      // Get demographics for this profile
      const { data: demographicsData } = await supabase
        .from('customer_demographics')
        .select('*')
        .eq('session_id', profile.sessionId)
        .single()

      if (!demographicsData) continue

      const demographics = {
        sessionId: demographicsData.session_id,
        ageRange: demographicsData.age_range,
        gender: demographicsData.gender,
        occupation: demographicsData.occupation,
        incomeRange: demographicsData.income_range,
        residentialArea: demographicsData.residential_area,
        customerTier: demographicsData.customer_tier,
        subscriptionStartDate: new Date(demographicsData.subscription_start_date),
        currentPlanType: demographicsData.current_plan_type,
        currentPlanPrice: demographicsData.current_plan_price,
        averageMonthlyUsageGb: demographicsData.average_monthly_usage_gb,
      }

      const purchaseHistory = this.generatePurchaseHistory(profile, demographics)

      // Insert purchases
      for (const purchase of purchaseHistory) {
        const { error } = await supabase.from('purchase_history').insert({
          session_id: purchase.sessionId,
          purchase_type: purchase.purchaseType,
          product_name: purchase.productName,
          price: purchase.price,
          purchase_date: purchase.purchaseDate.toISOString(),
          contract_months: purchase.contractMonths,
          metadata: purchase.metadata,
        })

        if (error) {
          console.error('Error inserting purchase:', error)
          throw error
        }
      }

      totalPurchases += purchaseHistory.length

      // Generate and insert devices
      const devices = this.generateDevices(profile, purchaseHistory)
      for (const device of devices) {
        const { error } = await supabase.from('customer_devices').insert({
          session_id: device.sessionId,
          device_type: device.deviceType,
          manufacturer: device.manufacturer,
          model_name: device.modelName,
          purchase_date: device.purchaseDate.toISOString(),
          is_current: device.isCurrent,
          device_age_months: device.deviceAgeMonths,
          condition: device.condition,
          battery_health_percent: device.batteryHealthPercent,
        })

        if (error) {
          console.error('Error inserting device:', error)
          throw error
        }
      }

      totalDevices += devices.length
    }

    console.log(`✓ Added ${totalPurchases} purchase records and ${totalDevices} devices`)
  }

  async seedFamilyMembers(profiles: CustomerProfile[]): Promise<void> {
    console.log('📊 Phase 3b: Adding family members...')

    let totalMembers = 0

    for (const profile of profiles) {
      const { data: demographicsData } = await supabase
        .from('customer_demographics')
        .select('*')
        .eq('session_id', profile.sessionId)
        .single()

      if (!demographicsData) continue

      const demographics = {
        sessionId: demographicsData.session_id,
        ageRange: demographicsData.age_range,
        gender: demographicsData.gender,
        occupation: demographicsData.occupation,
        incomeRange: demographicsData.income_range,
        residentialArea: demographicsData.residential_area,
        customerTier: demographicsData.customer_tier,
        subscriptionStartDate: new Date(demographicsData.subscription_start_date),
        currentPlanType: demographicsData.current_plan_type,
        currentPlanPrice: demographicsData.current_plan_price,
        averageMonthlyUsageGb: demographicsData.average_monthly_usage_gb,
      }

      const familyMembers = this.generateFamilyMembers(profile, demographics)

      for (const member of familyMembers) {
        const { error } = await supabase.from('family_members').insert({
          session_id: member.sessionId,
          relationship: member.relationship,
          age_range: member.ageRange,
          has_mobile_line: member.hasMobileLine,
          line_type: member.lineType,
          data_usage_level: member.dataUsageLevel,
        })

        if (error) {
          console.error('Error inserting family member:', error)
          throw error
        }
      }

      totalMembers += familyMembers.length
    }

    console.log(`✓ Added ${totalMembers} family members`)
  }

  async seedConversations(profiles: CustomerProfile[]): Promise<void> {
    console.log('📊 Phase 4: Creating conversations...')

    let totalConversations = 0
    let totalMessages = 0

    for (const profile of profiles) {
      const { data: demographicsData } = await supabase
        .from('customer_demographics')
        .select('*')
        .eq('session_id', profile.sessionId)
        .single()

      const { data: purchaseData } = await supabase
        .from('purchase_history')
        .select('*')
        .eq('session_id', profile.sessionId)

      if (!demographicsData || !purchaseData) continue

      const demographics = {
        sessionId: demographicsData.session_id,
        ageRange: demographicsData.age_range,
        gender: demographicsData.gender,
        occupation: demographicsData.occupation,
        incomeRange: demographicsData.income_range,
        residentialArea: demographicsData.residential_area,
        customerTier: demographicsData.customer_tier,
        subscriptionStartDate: new Date(demographicsData.subscription_start_date),
        currentPlanType: demographicsData.current_plan_type,
        currentPlanPrice: demographicsData.current_plan_price,
        averageMonthlyUsageGb: demographicsData.average_monthly_usage_gb,
      }

      const purchaseHistory = purchaseData.map((p: any) => ({
        sessionId: p.session_id,
        purchaseType: p.purchase_type,
        productName: p.product_name,
        price: p.price,
        purchaseDate: new Date(p.purchase_date),
        contractMonths: p.contract_months,
        metadata: p.metadata,
      }))

      const conversationData = this.generateConversations(profile, demographics, purchaseHistory)

      for (const conv of conversationData) {
        // Insert conversation
        const { data: conversationRecord, error: convError } = await supabase
          .from('conversations')
          .insert({
            session_id: profile.sessionId,
            status: 'ended',
            started_at: conv.conversationDate.toISOString(),
            ended_at: subtractDays(conv.conversationDate, -1).toISOString(),
          })
          .select('id')
          .single()

        if (convError || !conversationRecord) {
          console.error('Error inserting conversation:', convError)
          continue
        }

        const conversationId = conversationRecord.id

        // Insert messages
        for (const message of conv.template.messages) {
          const { error: msgError } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: message.role,
            content: message.content,
          })

          if (msgError) {
            console.error('Error inserting message:', msgError)
          } else {
            totalMessages++
          }
        }

        // Insert summary
        const summary = `${conv.template.category} 관련 문의: ${conv.template.messages[0].content}`
        const { error: summaryError } = await supabase.from('conversation_summaries').insert({
          conversation_id: conversationId,
          summary,
          category: conv.template.category,
          keywords: conv.template.keywords,
          sentiment: conv.template.sentiment,
        })

        if (summaryError) {
          console.error('Error inserting summary:', summaryError)
        }

        totalConversations++
      }
    }

    console.log(`✓ Created ${totalConversations} conversations with ${totalMessages} messages`)
  }

  async seedAppUsageMetrics(profiles: CustomerProfile[]): Promise<void> {
    console.log('📊 Phase 5: Adding app usage metrics...')

    let totalMetrics = 0

    for (const profile of profiles) {
      const { data: demographicsData } = await supabase
        .from('customer_demographics')
        .select('*')
        .eq('session_id', profile.sessionId)
        .single()

      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('*, conversation_summaries(*)')
        .eq('session_id', profile.sessionId)

      if (!demographicsData || !conversationsData) continue

      const demographics = {
        sessionId: demographicsData.session_id,
        ageRange: demographicsData.age_range,
        gender: demographicsData.gender,
        occupation: demographicsData.occupation,
        incomeRange: demographicsData.income_range,
        residentialArea: demographicsData.residential_area,
        customerTier: demographicsData.customer_tier,
        subscriptionStartDate: new Date(demographicsData.subscription_start_date),
        currentPlanType: demographicsData.current_plan_type,
        currentPlanPrice: demographicsData.current_plan_price,
        averageMonthlyUsageGb: demographicsData.average_monthly_usage_gb,
      }

      const conversations = conversationsData.map((c: any) => ({
        conversationDate: new Date(c.started_at),
        template: {
          category: c.conversation_summaries?.[0]?.category || 'general_inquiry',
          sentiment: c.conversation_summaries?.[0]?.sentiment || 'neutral',
        },
      }))

      const metrics = this.generateAppUsageMetrics(profile, demographics, conversations)

      for (const metric of metrics) {
        const { error } = await supabase.from('app_usage_metrics').insert({
          session_id: metric.sessionId,
          metric_date: metric.metricDate.toISOString().split('T')[0],
          chatbot_sessions_count: metric.chatbotSessionsCount,
          avg_session_duration_seconds: metric.avgSessionDurationSeconds,
          features_used: metric.featuresUsed,
          pages_visited: metric.pagesVisited,
          search_queries: metric.searchQueries,
          help_topics_viewed: metric.helpTopicsViewed,
        })

        if (error && !error.message.includes('duplicate')) {
          console.error('Error inserting metric:', error)
        } else {
          totalMetrics++
        }
      }
    }

    console.log(`✓ Added ${totalMetrics} app usage metrics`)
  }

  async generatePredictions(profiles: CustomerProfile[]): Promise<void> {
    console.log('🔮 Phase 6: Generating predictions...')

    let totalPredictions = 0

    for (const profile of profiles) {
      const { data: demographicsData } = await supabase
        .from('customer_demographics')
        .select('*')
        .eq('session_id', profile.sessionId)
        .single()

      const { data: purchaseData } = await supabase
        .from('purchase_history')
        .select('*')
        .eq('session_id', profile.sessionId)

      const { data: devicesData } = await supabase
        .from('customer_devices')
        .select('*')
        .eq('session_id', profile.sessionId)

      const { data: familyData } = await supabase
        .from('family_members')
        .select('*')
        .eq('session_id', profile.sessionId)

      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('*, conversation_summaries(*)')
        .eq('session_id', profile.sessionId)

      if (!demographicsData) continue

      const demographics = {
        sessionId: demographicsData.session_id,
        ageRange: demographicsData.age_range,
        gender: demographicsData.gender,
        occupation: demographicsData.occupation,
        incomeRange: demographicsData.income_range,
        residentialArea: demographicsData.residential_area,
        customerTier: demographicsData.customer_tier,
        subscriptionStartDate: new Date(demographicsData.subscription_start_date),
        currentPlanType: demographicsData.current_plan_type,
        currentPlanPrice: demographicsData.current_plan_price,
        averageMonthlyUsageGb: demographicsData.average_monthly_usage_gb,
      }

      const purchaseHistory = (purchaseData || []).map((p: any) => ({
        sessionId: p.session_id,
        purchaseType: p.purchase_type,
        productName: p.product_name,
        price: p.price,
        purchaseDate: new Date(p.purchase_date),
        contractMonths: p.contract_months,
        metadata: p.metadata,
      }))

      const devices = (devicesData || []).map((d: any) => ({
        sessionId: d.session_id,
        deviceType: d.device_type,
        manufacturer: d.manufacturer,
        modelName: d.model_name,
        purchaseDate: new Date(d.purchase_date),
        isCurrent: d.is_current,
        deviceAgeMonths: d.device_age_months,
        condition: d.condition,
        batteryHealthPercent: d.battery_health_percent,
      }))

      const familyMembers = (familyData || []).map((f: any) => ({
        sessionId: f.session_id,
        relationship: f.relationship,
        ageRange: f.age_range,
        hasMobileLine: f.has_mobile_line,
        lineType: f.line_type,
        dataUsageLevel: f.data_usage_level,
      }))

      const conversations = (conversationsData || []).map((c: any) => ({
        conversationDate: new Date(c.started_at),
        template: {
          category: c.conversation_summaries?.[0]?.category || 'general_inquiry',
          keywords: c.conversation_summaries?.[0]?.keywords || [],
          sentiment: c.conversation_summaries?.[0]?.sentiment || 'neutral',
        },
      }))

      const predictions = this.generateRuleBasedPrediction(
        profile,
        demographics,
        purchaseHistory,
        devices,
        familyMembers,
        conversations
      )

      for (const prediction of predictions) {
        const { error } = await supabase.from('purchase_predictions').insert(prediction)

        if (error) {
          console.error('Error inserting prediction:', error)
        } else {
          totalPredictions++
        }
      }
    }

    console.log(`✓ Generated ${totalPredictions} predictions`)
  }

  async validateDataConsistency(): Promise<void> {
    console.log('✅ Phase 7: Validating data consistency...')

    const { data: sessions } = await supabase.from('customer_sessions').select('id')
    const { data: demographics } = await supabase.from('customer_demographics').select('session_id')
    const { data: purchases } = await supabase.from('purchase_history').select('session_id')
    const { data: conversations } = await supabase.from('conversations').select('session_id')
    const { data: predictions } = await supabase.from('purchase_predictions').select('session_id')

    console.log(`  - Customer sessions: ${sessions?.length || 0}`)
    console.log(`  - Demographics records: ${demographics?.length || 0}`)
    console.log(`  - Purchase records: ${purchases?.length || 0}`)
    console.log(`  - Conversations: ${conversations?.length || 0}`)
    console.log(`  - Predictions: ${predictions?.length || 0}`)

    if (sessions?.length !== demographics?.length) {
      console.warn('⚠️  Warning: Mismatch between sessions and demographics')
    } else {
      console.log('✓ Data consistency validated')
    }
  }

  async seed(): Promise<void> {
    console.log('🌱 Starting prediction data seeding...\n')

    try {
      // Phase 1: Foundation
      const profiles = await this.seedCustomerSessions()

      // Phase 2: Customer context
      await this.seedDemographics(profiles)

      // Phase 3: Historical data
      await this.seedPurchaseHistoryAndDevices(profiles)
      await this.seedFamilyMembers(profiles)

      // Phase 4: Conversation data
      await this.seedConversations(profiles)

      // Phase 5: App usage
      await this.seedAppUsageMetrics(profiles)

      // Phase 6: Generate predictions
      await this.generatePredictions(profiles)

      // Phase 7: Validation
      await this.validateDataConsistency()

      console.log('\n✅ Seeding completed successfully!')
    } catch (error) {
      console.error('❌ Seeding failed:', error)
      throw error
    }
  }
}

// Run the seeder
const seeder = new PredictionDataSeeder()
seeder
  .seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
