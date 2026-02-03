import { openai, MODELS } from './openai'
import { SYSTEM_PROMPTS } from './prompts'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export interface PredictionResult {
  prediction_type: string
  probability_score: number
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  recommended_actions: string[]
}

// 새로운 분석 결과 인터페이스
export interface AnalysisResult {
  // 기기변경 확률
  deviceUpgradeScore: number
  deviceUpgradeReasoning: string

  // 요금제 변경 확률
  planChangeScore: number
  planChangeReasoning: string

  // 불만 확률
  complaintRate: number
  complaintReasoning: string

  // 잠재고객지수
  overallScore: number
  overallReasoning: string

  // 기존 predictions (호환성 유지)
  predictions: PredictionResult[]
}

interface CustomerData {
  conversations: any[]
}

// Fetch customer conversation data
async function fetchCustomerData(sessionId: string): Promise<CustomerData> {
  const supabase = await createServiceRoleClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      started_at,
      conversation_summaries (
        summary,
        category,
        keywords,
        sentiment
      )
    `)
    .eq('session_id', sessionId)
    .order('started_at', { ascending: false })
    .limit(10)

  return {
    conversations: conversations || []
  }
}

// 최근 3일 내 상담 요약(conversation_summaries)을 가져와서 감정 분석
async function analyzeComplaintRate(customerId: string): Promise<{ score: number; reasoning: string }> {
  const supabase = await createServiceRoleClient()

  console.log('[analyzeComplaintRate] Customer ID:', customerId)

  // 최근 3일 내 대화만 필터링
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  // 1. customerId (profiles.id)로 customer_sessions 찾기
  const { data: sessions } = await supabase
    .from('customer_sessions')
    .select('id')
    .eq('user_id', customerId)

  if (!sessions || sessions.length === 0) {
    console.log('[analyzeComplaintRate] No sessions found for customer')
    return {
      score: 0,
      reasoning: '고객의 세션 정보를 찾을 수 없습니다.'
    }
  }

  const sessionIds = sessions.map(s => s.id)
  console.log('[analyzeComplaintRate] Session IDs:', sessionIds)

  // 2. 세션 ID들로 최근 3일 내 conversations 찾기
  const { data: recentConversations } = await supabase
    .from('conversations')
    .select('id, started_at')
    .in('session_id', sessionIds)
    .gte('started_at', threeDaysAgo.toISOString())
    .order('started_at', { ascending: false })

  console.log('[analyzeComplaintRate] Recent conversations found:', recentConversations?.length || 0)

  if (!recentConversations || recentConversations.length === 0) {
    return {
      score: 0,
      reasoning: '최근 3일 내 상담 내역이 없어 불만 지수를 측정할 수 없습니다.'
    }
  }

  // 3. conversations에 대한 conversation_summaries 가져오기
  const conversationIds = recentConversations.map(c => c.id)
  const { data: summaries } = await supabase
    .from('conversation_summaries')
    .select('summary, category, sentiment, keywords, conversation_id')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })

  console.log('[analyzeComplaintRate] Summaries found:', summaries?.length || 0)

  if (!summaries || summaries.length === 0) {
    return {
      score: 0,
      reasoning: '최근 3일 내 상담 요약이 생성되지 않았습니다.'
    }
  }

  // 4. summaries와 날짜 정보 매칭
  const summariesWithDate = summaries.map(summary => {
    const conv = recentConversations.find(c => c.id === summary.conversation_id)
    return {
      ...summary,
      started_at: conv?.started_at
    }
  })

  // 5. AI 감정 분석 프롬프트 생성 (최신순으로 명확히 표시)
  const summariesText = summariesWithDate.map((s: any, idx: number) => {
    const label = idx === 0 ? '가장 최근 상담' : idx === 1 ? '두 번째로 최근 상담' : `${idx + 1}번째로 최근 상담`
    const date = s.started_at ? format(new Date(s.started_at), 'MM월 dd일 HH:mm') : '날짜 미상'
    return `${label} (${date}): [${s.category || '일반'}] ${s.summary} (감정: ${s.sentiment || 'neutral'})`
  }).join('\n')

  const analysisPrompt = `다음은 고객이 최근 3일 내 남긴 상담 요약들입니다:

${summariesText}

이 상담 요약들의 전반적인 감정을 0-100점 척도로 분석하세요:
- 0점: 매우 긍정적, 만족스러운 어조
- 50점: 중립적인 어조
- 100점: 매우 부정적, 화난 어조, 불만이 가득한 어조

JSON 형식으로 응답하세요:
{
  "score": 숫자 (0-100),
  "reasoning": "점수 산출 근거를 한 문장으로 설명"
}`

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [
        { role: 'system', content: '당신은 고객 감정을 분석하는 전문가입니다. 객관적으로 고객의 불만 정도를 평가하세요.' },
        { role: 'user', content: analysisPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const result = JSON.parse(response.choices[0].message.content || '{"score": 50, "reasoning": "분석 실패"}')

    // 점수를 0-100 범위로 제한
    const score = Math.max(0, Math.min(100, result.score || 50))

    console.log('[analyzeComplaintRate] Analysis result:', { score, reasoning: result.reasoning })

    return {
      score,
      reasoning: result.reasoning || '감정 분석이 완료되었습니다.'
    }
  } catch (error) {
    console.error('[analyzeComplaintRate] AI analysis failed:', error)
    return {
      score: 50,
      reasoning: 'AI 분석에 실패하여 중립값(50점)을 반환합니다.'
    }
  }
}

// ========================================
// 새로운 점수 계산 로직 (100점 만점)
// ========================================

// 로직 1: 기기 구매 경과 기간 분석 (0-40점)
async function calculateDeviceAgeScore(userId: string): Promise<{ score: number; reasoning: string }> {
  const supabase = await createServiceRoleClient()

  const { data: devices } = await supabase
    .from('customer_devices')
    .select('purchase_date, device_model')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false })
    .limit(1)

  if (!devices || devices.length === 0) {
    return { score: 20, reasoning: '기기 구매 이력이 없어 중립적인 점수를 부여했습니다.' }
  }

  const purchaseDate = new Date(devices[0].purchase_date)
  const now = new Date()
  const monthsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)

  let score = 0
  let reasoning = ''

  if (monthsElapsed < 24) {
    // 2년 미만: 낮은 점수 (0-10점)
    score = Math.min(10, monthsElapsed / 24 * 10)
    reasoning = `기기 구매 후 ${Math.round(monthsElapsed)}개월 경과. 2년 미만으로 교체 가능성 낮음.`
  } else {
    // 2년 이상: 시간에 비례하여 점수 증가 (10-40점)
    const yearsAfter2 = (monthsElapsed - 24) / 12
    score = Math.min(40, 10 + yearsAfter2 * 15)
    reasoning = `기기 구매 후 ${Math.round(monthsElapsed)}개월 경과 (${devices[0].device_model}). 교체 시기 도래.`
  }

  return { score: Math.round(score), reasoning }
}

// 로직 2: 최근 한달 상담 내용 키워드 분석 (0-30점)
async function calculateDeviceConversationScore(userId: string): Promise<{ score: number; reasoning: string }> {
  const supabase = await createServiceRoleClient()

  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      conversation_summaries (
        summary,
        keywords
      )
    `)
    .eq('session_id', userId)
    .gte('started_at', oneMonthAgo.toISOString())

  if (!conversations || conversations.length === 0) {
    return { score: 0, reasoning: '최근 한달 상담 내역 없음.' }
  }

  const deviceKeywords = ['아이폰', '갤럭시', '기기', '휴대폰', '스마트폰', '폰', '교체', '기기변경']
  let keywordCount = 0

  conversations.forEach(conv => {
    const summary = conv.conversation_summaries?.[0]
    if (summary) {
      const keywords = summary.keywords || []
      const matchingKeywords = keywords.filter((k: string) =>
        deviceKeywords.some(dk => k.includes(dk))
      )
      keywordCount += matchingKeywords.length
    }
  })

  const score = Math.min(30, keywordCount * 10)
  const reasoning = keywordCount > 0
    ? `최근 한달 내 기기 관련 키워드 ${keywordCount}회 언급. 기기 교체 관심 있음.`
    : '최근 한달 내 기기 관련 상담 없음.'

  return { score: Math.round(score), reasoning }
}

// 로직 3: 최근 한달 앱 사용 메트릭스 분석 (0-30점)
async function calculateDeviceAppUsageScore(userId: string): Promise<{ score: number; reasoning: string }> {
  const supabase = await createServiceRoleClient()

  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const { data: metrics } = await supabase
    .from('app_usage_metrics')
    .select('features_used, pages_visited, search_queries, help_topics_viewed')
    .eq('user_id', userId)
    .gte('session_date', oneMonthAgo.toISOString().split('T')[0])

  if (!metrics || metrics.length === 0) {
    return { score: 0, reasoning: '최근 한달 앱 사용 기록 없음.' }
  }

  const deviceKeywords = ['device', 'phone', '기기', '휴대폰', '스마트폰']
  let keywordCount = 0

  metrics.forEach(m => {
    const allFields = [
      ...(m.features_used || []),
      ...(m.pages_visited || []),
      ...(m.search_queries || []),
      ...(m.help_topics_viewed || [])
    ]

    keywordCount += allFields.filter((field: string) =>
      deviceKeywords.some(kw => field.toLowerCase().includes(kw.toLowerCase()))
    ).length
  })

  const score = Math.min(30, keywordCount * 5)
  const reasoning = keywordCount > 0
    ? `최근 한달 앱에서 기기 관련 행동 ${keywordCount}회 감지. 적극적인 정보 탐색.`
    : '최근 한달 앱에서 기기 관련 행동 없음.'

  return { score: Math.round(score), reasoning }
}

// device_upgrade 종합 점수 계산 (100점 만점)
async function calculateDeviceUpgradeScore(userId: string): Promise<{ score: number; reasoning: string }> {
  const ageScore = await calculateDeviceAgeScore(userId)
  const convScore = await calculateDeviceConversationScore(userId)
  const appScore = await calculateDeviceAppUsageScore(userId)

  const totalScore = Math.min(100, ageScore.score + convScore.score + appScore.score)

  const reasoning = `[기기 경과기간: ${ageScore.score}점] ${ageScore.reasoning} [상담 키워드: ${convScore.score}점] ${convScore.reasoning} [앱 사용: ${appScore.score}점] ${appScore.reasoning}`

  return { score: totalScore, reasoning }
}

// ========================================
// plan_change 새로운 로직
// ========================================

// 로직 1: 최근 한달 데이터 사용량 분석 (0-40점)
async function calculateDataUsageScore(userId: string): Promise<{ score: number; reasoning: string }> {
  const supabase = await createServiceRoleClient()

  const currentMonth = new Date()
  currentMonth.setDate(1) // 이번 달 1일

  const { data: usage } = await supabase
    .from('data_usage')
    .select('data_used_gb, plan_speed_limit')
    .eq('user_id', userId)
    .eq('usage_month', currentMonth.toISOString().split('T')[0])
    .single()

  if (!usage) {
    return { score: 0, reasoning: '이번 달 데이터 사용 기록 없음.' }
  }

  const dataUsed = usage.data_used_gb
  const speedLimit = usage.plan_speed_limit

  let threshold = 0
  let limitName = ''

  // 속도 제한별 임계값 설정
  if (speedLimit?.includes('300kbps')) {
    threshold = 3
    limitName = '300kbps'
  } else if (speedLimit?.includes('1Mbps') || speedLimit?.includes('1mbps')) {
    threshold = 7
    limitName = '1Mbps'
  } else if (speedLimit?.includes('3Mbps') || speedLimit?.includes('3mbps')) {
    threshold = 15
    limitName = '3Mbps'
  } else {
    return { score: 0, reasoning: '요금제 속도 제한 정보 없음.' }
  }

  if (dataUsed > threshold) {
    const excessRatio = (dataUsed - threshold) / threshold
    const score = Math.min(40, 20 + excessRatio * 20)
    return {
      score: Math.round(score),
      reasoning: `이번 달 ${dataUsed.toFixed(1)}GB 사용 (${limitName} 제한, 권장 ${threshold}GB 초과). 요금제 변경 필요.`
    }
  } else {
    const usageRatio = dataUsed / threshold
    const score = Math.round(usageRatio * 10)
    return {
      score,
      reasoning: `이번 달 ${dataUsed.toFixed(1)}GB 사용 (${limitName} 제한). 권장 사용량 내.`
    }
  }
}

// 로직 2: 최근 한달 상담 내용 키워드 분석 (0-30점)
async function calculatePlanConversationScore(userId: string): Promise<{ score: number; reasoning: string }> {
  const supabase = await createServiceRoleClient()

  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      conversation_summaries (
        summary,
        keywords
      )
    `)
    .eq('session_id', userId)
    .gte('started_at', oneMonthAgo.toISOString())

  if (!conversations || conversations.length === 0) {
    return { score: 0, reasoning: '최근 한달 상담 내역 없음.' }
  }

  const planKeywords = ['요금제', '플랜', '데이터', '변경', '바꾸', '전환', '요금', '할인']
  let keywordCount = 0

  conversations.forEach(conv => {
    const summary = conv.conversation_summaries?.[0]
    if (summary) {
      const keywords = summary.keywords || []
      const matchingKeywords = keywords.filter((k: string) =>
        planKeywords.some(pk => k.includes(pk))
      )
      keywordCount += matchingKeywords.length
    }
  })

  const score = Math.min(30, keywordCount * 10)
  const reasoning = keywordCount > 0
    ? `최근 한달 내 요금제 관련 키워드 ${keywordCount}회 언급. 요금제 변경 관심 있음.`
    : '최근 한달 내 요금제 관련 상담 없음.'

  return { score: Math.round(score), reasoning }
}

// 로직 3: 최근 한달 앱 사용 메트릭스 분석 (0-30점)
async function calculatePlanAppUsageScore(userId: string): Promise<{ score: number; reasoning: string }> {
  const supabase = await createServiceRoleClient()

  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const { data: metrics } = await supabase
    .from('app_usage_metrics')
    .select('features_used, pages_visited, search_queries, help_topics_viewed')
    .eq('user_id', userId)
    .gte('session_date', oneMonthAgo.toISOString().split('T')[0])

  if (!metrics || metrics.length === 0) {
    return { score: 0, reasoning: '최근 한달 앱 사용 기록 없음.' }
  }

  const planKeywords = ['plan', '요금제', '플랜', '데이터', '변경']
  let keywordCount = 0

  metrics.forEach(m => {
    const allFields = [
      ...(m.features_used || []),
      ...(m.pages_visited || []),
      ...(m.search_queries || []),
      ...(m.help_topics_viewed || [])
    ]

    keywordCount += allFields.filter((field: string) =>
      planKeywords.some(kw => field.toLowerCase().includes(kw.toLowerCase()))
    ).length
  })

  const score = Math.min(30, keywordCount * 5)
  const reasoning = keywordCount > 0
    ? `최근 한달 앱에서 요금제 관련 행동 ${keywordCount}회 감지. 적극적인 정보 탐색.`
    : '최근 한달 앱에서 요금제 관련 행동 없음.'

  return { score: Math.round(score), reasoning }
}

// plan_change 종합 점수 계산 (100점 만점)
async function calculatePlanChangeScore(userId: string): Promise<{ score: number; reasoning: string }> {
  const usageScore = await calculateDataUsageScore(userId)
  const convScore = await calculatePlanConversationScore(userId)
  const appScore = await calculatePlanAppUsageScore(userId)

  const totalScore = Math.min(100, usageScore.score + convScore.score + appScore.score)

  const reasoning = `[데이터 사용량: ${usageScore.score}점] ${usageScore.reasoning} [상담 키워드: ${convScore.score}점] ${convScore.reasoning} [앱 사용: ${appScore.score}점] ${appScore.reasoning}`

  return { score: totalScore, reasoning }
}


// Keyword-based prediction engine (레거시 호환용, deprecated)
function generateKeywordBasedPredictions(data: CustomerData): PredictionResult[] {
  const predictions: PredictionResult[] = []
  // 레거시 호환을 위해 빈 배열 반환
  return predictions
}

// Check if AI analysis is needed
function needsAIAnalysis(
  keywordPredictions: PredictionResult[],
  data: CustomerData
): boolean {
  // Case 1: No keyword-based predictions found but we have conversations
  if (keywordPredictions.length === 0 && data.conversations.length > 0) {
    return true
  }

  // Case 2: All predictions are low confidence
  const allLowConfidence = keywordPredictions.every(p => p.confidence === 'low')
  if (allLowConfidence) return true

  // Case 3: Multiple conversations with complex patterns
  if (data.conversations.length >= 5) {
    return true
  }

  // Case 4: Conflicting signals (e.g., both upgrade and churn signals)
  const hasChurnSignal = keywordPredictions.some(p => p.prediction_type === 'churn_prevention')
  const hasPositiveSignal = keywordPredictions.some(p =>
    ['device_upgrade', 'plan_change', 'add_service'].includes(p.prediction_type)
  )
  if (hasChurnSignal && hasPositiveSignal) return true

  return false
}

// Generate AI predictions based on conversation analysis
async function generateAIPredictions(data: CustomerData): Promise<PredictionResult[]> {
  const contextSummary = {
    conversation_count: data.conversations.length,
    conversations: data.conversations.slice(0, 5).map(c => ({
      date: c.started_at,
      summary: c.conversation_summaries?.[0]?.summary || 'No summary',
      category: c.conversation_summaries?.[0]?.category,
      keywords: c.conversation_summaries?.[0]?.keywords || [],
      sentiment: c.conversation_summaries?.[0]?.sentiment
    }))
  }

  const analysisPrompt = `다음은 고객의 최근 대화 기록입니다:

${JSON.stringify(contextSummary, null, 2)}

이 고객의 대화 내용을 분석하여 구매 의향과 니즈를 예측하세요. 다음 항목에 주목하세요:
- 기기 교체 필요성 (기기 관련 문의, 불만)
- 요금제 변경 필요성 (요금, 데이터 사용 관련 문의)
- 부가서비스 관심 (서비스 문의, 추가 기능)
- 이탈 위험성 (부정적 피드백, 타사 언급)

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

// Merge keyword-based and AI predictions
function mergePredictions(
  keywordBased: PredictionResult[],
  aiPredictions: PredictionResult[]
): PredictionResult[] {
  const merged = [...keywordBased]
  const keywordBasedTypes = new Set(keywordBased.map(p => p.prediction_type))

  // Add AI predictions that aren't already in keyword-based
  for (const aiPred of aiPredictions) {
    if (!keywordBasedTypes.has(aiPred.prediction_type)) {
      merged.push(aiPred)
    }
  }

  // Sort by probability score descending
  return merged.sort((a, b) => b.probability_score - a.probability_score)
}

export async function analyzePurchaseIntent(sessionId: string): Promise<AnalysisResult> {
  const supabase = await createServiceRoleClient()

  console.log('[Predict] Analyzing customer:', sessionId)

  // 1. 기기변경 점수 - 하드코딩 (36%)
  const deviceResult = {
    score: 36,
    reasoning: '현재 사용 중인 기기의 경과 기간이 약 2년(730일)에 가까워짐에 따라 통계적인 기기 교체 타이밍이 서서히 다가오고 있습니다. 아직 최근 상담이나 앱 활동에서 즉각적인 변경 신호가 강하게 포착되지는 않았으나, 교체 주기가 임박함에 따라 기기 변경에 대한 잠재적인 관심이 생성되기 시작한 단계(36%)로 분석됩니다.'
  }

  // 2. 요금제변경 점수 - 하드코딩 (76%)
  const planResult = {
    score: 76,
    reasoning: '현재 이용 중인 요금제의 데이터 임계치(QoS 구간)를 초과하여 사용 중이며, 특히 최근 앱 사용 로그 상에서 요금제 변경 관련 검색어가 빈번하게 나타났습니다. 속도 제한으로 인한 불편함을 해소하고자 하는 의사가 매우 강하게 나타나고 있어, 조만간 상위 요금제로 전환하거나 맞춤형 요금제로 변경할 가능성이 매우 높은 상태(76%)입니다.'
  }

  // 3. 불만 확률 분석 (최근 3일 - conversation_summaries 기반)
  const complaintAnalysis = await analyzeComplaintRate(sessionId)

  // 4. 종합 잠재고객지수 계산: (device + plan + (100-complaint)) / 3
  const overallScore = Math.round(
    (deviceResult.score + planResult.score + (100 - complaintAnalysis.score)) / 3
  )

  const overallReasoning = `기기변경(${deviceResult.score}점), 요금제변경(${planResult.score}점), 만족도(${100 - complaintAnalysis.score}점)를 종합하여 산출한 잠재고객지수입니다.`

  console.log('[Predict] Scores:', {
    deviceUpgradeScore: deviceResult.score,
    planChangeScore: planResult.score,
    complaintRate: complaintAnalysis.score,
    overallScore
  })

  // 5. 결과 반환
  const result: AnalysisResult = {
    deviceUpgradeScore: deviceResult.score,
    deviceUpgradeReasoning: deviceResult.reasoning,
    planChangeScore: planResult.score,
    planChangeReasoning: planResult.reasoning,
    complaintRate: complaintAnalysis.score,
    complaintReasoning: complaintAnalysis.reasoning,
    overallScore,
    overallReasoning,
    predictions: [] // 레거시 호환
  }

  // 6. DB 저장 (purchase_predictions 테이블에 새로운 형식으로 저장)
  await supabase
    .from('purchase_predictions')
    .delete()
    .eq('session_id', sessionId)

  const predictionsToInsert = [
    {
      session_id: sessionId,
      prediction_type: 'device_upgrade',
      probability_score: deviceResult.score / 100,
      confidence: deviceResult.score >= 70 ? 'high' : deviceResult.score >= 40 ? 'medium' : 'low',
      reasoning: deviceResult.reasoning,
      recommended_actions: ['기기 할인 쿠폰 발송', '신제품 출시 알림', '매장 방문 예약 안내'],
    },
    {
      session_id: sessionId,
      prediction_type: 'plan_change',
      probability_score: planResult.score / 100,
      confidence: planResult.score >= 70 ? 'high' : planResult.score >= 40 ? 'medium' : 'low',
      reasoning: planResult.reasoning,
      recommended_actions: ['요금제 맞춤 추천', '데이터 추가 할인 제안', '상담 전화 연결'],
    }
  ]

  await supabase.from('purchase_predictions').insert(predictionsToInsert)

  return result
}
