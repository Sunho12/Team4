import { openai, MODELS } from './openai'
import { SYSTEM_PROMPTS } from './prompts'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface PredictionResult {
  prediction_type: string
  probability_score: number
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  recommended_actions: string[]
}

interface CustomerData {
  demographics: any
  purchaseHistory: any[]
  devices: any[]
  familyMembers: any[]
  conversations: any[]
  appUsageMetrics: any[]
}

// Fetch all customer data from new tables
async function fetchAllCustomerData(sessionId: string): Promise<CustomerData> {
  const supabase = await createServiceRoleClient()

  const [
    { data: demographics },
    { data: purchaseHistory },
    { data: devices },
    { data: familyMembers },
    { data: conversations },
    { data: appUsageMetrics }
  ] = await Promise.all([
    supabase.from('customer_demographics').select('*').eq('session_id', sessionId).single(),
    supabase.from('purchase_history').select('*').eq('session_id', sessionId).order('purchase_date', { ascending: false }),
    supabase.from('customer_devices').select('*').eq('session_id', sessionId).order('purchase_date', { ascending: false }),
    supabase.from('family_members').select('*').eq('session_id', sessionId),
    supabase.from('conversations').select(`
      id,
      started_at,
      conversation_summaries (
        summary,
        category,
        keywords,
        sentiment
      )
    `).eq('session_id', sessionId).order('started_at', { ascending: false }).limit(10),
    supabase.from('app_usage_metrics').select('*').eq('session_id', sessionId).order('metric_date', { ascending: false }).limit(90)
  ])

  return {
    demographics: demographics || null,
    purchaseHistory: purchaseHistory || [],
    devices: devices || [],
    familyMembers: familyMembers || [],
    conversations: conversations || [],
    appUsageMetrics: appUsageMetrics || []
  }
}

// Rule-based prediction engine (fast, no OpenAI cost)
function generateRuleBasedPredictions(data: CustomerData): PredictionResult[] {
  const predictions: PredictionResult[] = []
  const now = new Date()

  // 1. Device upgrade prediction
  const currentDevice = data.devices.find(d => d.is_current)
  if (currentDevice) {
    let score = 0

    // Device age scoring
    if (currentDevice.device_age_months >= 24) score += 0.3
    if (currentDevice.device_age_months >= 30) score += 0.2

    // Battery health scoring
    if (currentDevice.battery_health_percent && currentDevice.battery_health_percent < 80) {
      score += 0.15
    }

    // Conversation mentions
    const deviceUpgradeConversations = data.conversations.filter(c =>
      c.conversation_summaries?.[0]?.category === 'device_upgrade' ||
      c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
        ['기기변경', '휴대폰', '스마트폰', '아이폰', '갤럭시'].includes(k)
      )
    )
    score += deviceUpgradeConversations.length * 0.15

    // Device condition
    if (currentDevice.condition === 'poor') score += 0.15
    else if (currentDevice.condition === 'fair') score += 0.1

    if (score >= 0.6) {
      predictions.push({
        prediction_type: 'device_upgrade',
        probability_score: Math.min(score, 0.99),
        confidence: score >= 0.7 ? 'high' : 'medium',
        reasoning: `기기 사용 기간(${currentDevice.device_age_months}개월)${currentDevice.battery_health_percent ? `과 배터리 상태(${currentDevice.battery_health_percent}%)` : ''}를 고려할 때 기기 변경 가능성이 높습니다.`,
        recommended_actions: ['기기 할인 쿠폰 발송', '신제품 출시 알림', '매장 방문 예약 안내']
      })
    }
  }

  // 2. Plan change prediction
  if (data.demographics) {
    let planScore = 0

    // Parse plan data limit
    const planType = data.demographics.current_plan_type
    let planDataLimit = 200 // unlimited default
    if (planType.includes('GB')) {
      const match = planType.match(/(\d+)GB/)
      if (match) planDataLimit = parseInt(match[1])
    }

    // Usage ratio analysis
    const usageRatio = data.demographics.average_monthly_usage_gb / planDataLimit

    if (usageRatio > 0.9) planScore += 0.3 // Exceeding limit
    if (usageRatio < 0.3) planScore += 0.25 // Under-utilizing

    // Conversation mentions
    const planChangeConversations = data.conversations.filter(c =>
      c.conversation_summaries?.[0]?.category === 'plan_change' ||
      c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
        ['요금제', '플랜', '데이터', '변경'].includes(k)
      )
    )
    planScore += planChangeConversations.length * 0.15

    // Billing complaints
    const billingComplaints = data.conversations.filter(c =>
      c.conversation_summaries?.[0]?.category === 'billing_inquiry' &&
      c.conversation_summaries?.[0]?.sentiment === 'negative'
    )
    planScore += billingComplaints.length * 0.15

    // Price sensitivity from conversations
    const priceSensitive = data.conversations.some(c =>
      c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
        ['비싸', '비용', '할인', '저렴'].includes(k)
      )
    )
    if (priceSensitive) planScore += 0.1

    if (planScore >= 0.5) {
      predictions.push({
        prediction_type: 'plan_change',
        probability_score: Math.min(planScore, 0.99),
        confidence: planScore >= 0.7 ? 'high' : 'medium',
        reasoning: usageRatio > 0.9
          ? `월 데이터 사용량(${data.demographics.average_monthly_usage_gb.toFixed(1)}GB)이 요금제 한도에 근접하여 더 큰 요금제로 변경이 필요할 수 있습니다.`
          : `월 데이터 사용량(${data.demographics.average_monthly_usage_gb.toFixed(1)}GB)이 낮아 더 저렴한 요금제로 변경 시 요금 절약이 가능합니다.`,
        recommended_actions: ['요금제 맞춤 추천', '데이터 추가 할인 제안', '상담 전화 연결']
      })
    }
  }

  // 3. Add service prediction
  if (data.demographics) {
    let serviceScore = 0

    // Family members without lines
    const familyWithoutLines = data.familyMembers.filter(m =>
      !m.has_mobile_line && m.age_range !== 'child'
    )
    serviceScore += familyWithoutLines.length * 0.2

    // High data usage without sharing service
    const hasDataSharing = data.purchaseHistory.some(p =>
      p.product_name.includes('데이터 쉐어링')
    )
    if (data.demographics.average_monthly_usage_gb > 100 && !hasDataSharing) {
      serviceScore += 0.25
    }

    // Add service conversations
    const addServiceConversations = data.conversations.filter(c =>
      c.conversation_summaries?.[0]?.category === 'add_service' ||
      c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
        ['부가서비스', '쉐어링', 'OTT', '결합'].includes(k)
      )
    )
    serviceScore += addServiceConversations.length * 0.2

    // VIP tier bonus
    if (data.demographics.customer_tier === 'vip') {
      serviceScore += 0.1
    }

    if (serviceScore >= 0.5) {
      predictions.push({
        prediction_type: 'add_service',
        probability_score: Math.min(serviceScore, 0.99),
        confidence: serviceScore >= 0.7 ? 'high' : 'medium',
        reasoning: familyWithoutLines.length > 0
          ? `가족 구성원 중 회선이 없는 분들이 ${familyWithoutLines.length}명 계셔서 데이터 쉐어링이나 추가 회선 개통을 고려할 수 있습니다.`
          : '높은 데이터 사용량과 고객 등급을 고려할 때 부가서비스 가입 가능성이 있습니다.',
        recommended_actions: ['가족 데이터 쉐어링 안내', '멤버십 혜택 소개', '부가서비스 무료 체험']
      })
    }
  }

  // 4. Churn prevention
  let churnScore = 0

  // Negative sentiment conversations
  const negativeConversations = data.conversations.filter(c =>
    c.conversation_summaries?.[0]?.sentiment === 'negative'
  )
  churnScore += negativeConversations.length * 0.25

  // Churn keywords
  const churnKeywords = data.conversations.filter(c =>
    c.conversation_summaries?.[0]?.keywords?.some((k: string) =>
      ['타사', '번호이동', '해지', '불만', '취소'].includes(k)
    )
  )
  churnScore += churnKeywords.length * 0.4

  // Low engagement
  const recentMetrics = data.appUsageMetrics.slice(0, 30) // Last 30 days
  const avgSessions = recentMetrics.length > 0
    ? recentMetrics.reduce((sum, m) => sum + m.chatbot_sessions_count, 0) / recentMetrics.length
    : 0
  if (avgSessions < 0.5 && data.conversations.length > 0) { // Low engagement with history
    churnScore += 0.2
  }

  // Last contact over 90 days ago
  if (data.conversations.length > 0) {
    const lastConversation = data.conversations[0]
    const daysSinceLastContact = Math.floor(
      (now.getTime() - new Date(lastConversation.started_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastContact > 90) churnScore += 0.15
  }

  if (churnScore >= 0.7) {
    predictions.push({
      prediction_type: 'churn_prevention',
      probability_score: Math.min(churnScore, 0.99),
      confidence: 'high',
      reasoning: '부정적인 상담 이력과 타사 전환 언급으로 인해 이탈 위험이 높습니다. 적극적인 리텐션 활동이 필요합니다.',
      recommended_actions: ['고객 만족도 조사', 'VIP 혜택 제공', '긴급 상담 요청']
    })
  }

  return predictions
}

// Check if AI analysis is needed
function needsAIAnalysis(
  ruleBasedPredictions: PredictionResult[],
  data: CustomerData
): boolean {
  // Case 1: No rule-based predictions found
  if (ruleBasedPredictions.length === 0) {
    return data.conversations.length > 0 // Only if there's data to analyze
  }

  // Case 2: All predictions are low confidence
  const allLowConfidence = ruleBasedPredictions.every(p => p.confidence === 'low')
  if (allLowConfidence) return true

  // Case 3: VIP customer with complex patterns
  if (data.demographics?.customer_tier === 'vip' && data.conversations.length >= 5) {
    return true
  }

  // Case 4: Conflicting signals (e.g., both upgrade and churn signals)
  const hasChurnSignal = ruleBasedPredictions.some(p => p.prediction_type === 'churn_prevention')
  const hasPositiveSignal = ruleBasedPredictions.some(p =>
    ['device_upgrade', 'plan_change', 'add_service'].includes(p.prediction_type)
  )
  if (hasChurnSignal && hasPositiveSignal) return true

  return false
}

// Generate AI predictions with rich context
async function generateAIPredictions(data: CustomerData): Promise<PredictionResult[]> {
  const contextSummary = {
    demographics: data.demographics ? {
      age_range: data.demographics.age_range,
      customer_tier: data.demographics.customer_tier,
      current_plan: data.demographics.current_plan_type,
      monthly_usage_gb: data.demographics.average_monthly_usage_gb,
      subscription_years: Math.floor(
        (new Date().getTime() - new Date(data.demographics.subscription_start_date).getTime()) / (1000 * 60 * 60 * 24 * 365)
      )
    } : null,
    device: data.devices[0] ? {
      model: data.devices[0].model_name,
      age_months: data.devices[0].device_age_months,
      condition: data.devices[0].condition,
      battery_health: data.devices[0].battery_health_percent
    } : null,
    recent_purchases: data.purchaseHistory.slice(0, 3).map(p => ({
      type: p.purchase_type,
      product: p.product_name,
      months_ago: Math.floor(
        (new Date().getTime() - new Date(p.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    })),
    family: {
      total_members: data.familyMembers.length,
      members_without_lines: data.familyMembers.filter(m => !m.has_mobile_line).length
    },
    conversations: data.conversations.slice(0, 5).map(c => c.conversation_summaries?.[0]).filter(Boolean),
    engagement: data.appUsageMetrics.length > 0 ? {
      avg_weekly_sessions: (data.appUsageMetrics.slice(0, 7).reduce((sum, m) => sum + m.chatbot_sessions_count, 0) / 7).toFixed(1),
      recent_features: [...new Set(data.appUsageMetrics.slice(0, 7).flatMap(m => m.features_used))].slice(0, 5)
    } : null
  }

  const analysisPrompt = `다음은 고객의 종합 데이터입니다:

${JSON.stringify(contextSummary, null, 2)}

이 고객의 구매 의향과 행동 패턴을 분석하여 정확한 예측을 제공하세요. 특히 다음 사항에 주목하세요:
- 기기 교체 필요성 (나이, 상태, 배터리)
- 요금제 변경 필요성 (사용량 vs 플랜)
- 부가서비스 추천 (가족 구성, 사용 패턴)
- 이탈 위험성 (부정적 피드백, 참여도)

JSON 형식으로 응답하세요.`

  const response = await openai.chat.completions.create({
    model: MODELS.CHAT,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.PREDICT },
      { role: 'user', content: analysisPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return result.predictions || []
}

// Merge rule-based and AI predictions
function mergePredictions(
  ruleBased: PredictionResult[],
  aiPredictions: PredictionResult[]
): PredictionResult[] {
  const merged = [...ruleBased]
  const ruleBasedTypes = new Set(ruleBased.map(p => p.prediction_type))

  // Add AI predictions that aren't already in rule-based
  for (const aiPred of aiPredictions) {
    if (!ruleBasedTypes.has(aiPred.prediction_type)) {
      merged.push(aiPred)
    }
  }

  // Sort by probability score descending
  return merged.sort((a, b) => b.probability_score - a.probability_score)
}

export async function analyzePurchaseIntent(sessionId: string): Promise<PredictionResult[]> {
  const supabase = await createServiceRoleClient()

  // Fetch all customer data
  const customerData = await fetchAllCustomerData(sessionId)

  // Check if we have enough data
  if (!customerData.demographics && customerData.conversations.length === 0) {
    throw new Error('Insufficient customer data for analysis')
  }

  // Generate rule-based predictions (fast, always runs)
  const ruleBasedPredictions = generateRuleBasedPredictions(customerData)

  // Determine if AI analysis is needed
  let finalPredictions = ruleBasedPredictions

  if (needsAIAnalysis(ruleBasedPredictions, customerData)) {
    try {
      const aiPredictions = await generateAIPredictions(customerData)
      finalPredictions = mergePredictions(ruleBasedPredictions, aiPredictions)
    } catch (error) {
      console.error('AI prediction failed, using rule-based only:', error)
      // Fall back to rule-based if AI fails
    }
  }

  // Delete existing predictions for this session
  await supabase
    .from('purchase_predictions')
    .delete()
    .eq('session_id', sessionId)

  // Save new predictions to database
  if (finalPredictions.length > 0) {
    const predictionsToInsert = finalPredictions.map(pred => ({
      session_id: sessionId,
      prediction_type: pred.prediction_type,
      probability_score: pred.probability_score,
      confidence: pred.confidence,
      reasoning: pred.reasoning,
      recommended_actions: pred.recommended_actions,
    }))

    await supabase.from('purchase_predictions').insert(predictionsToInsert)
  }

  return finalPredictions
}
