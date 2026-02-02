import { NextResponse } from 'next/server'
import { saveMessage, getConversationMessages } from '@/lib/services/chatService'
import { openai, MODELS } from '@/lib/ai/openai'
import { retrieveContext } from '@/lib/ai/rag'
import { buildChatSystemPrompt } from '@/lib/ai/prompts'
import { searchSKTStores, formatStoreResults } from '@/lib/utils/storeSearch'

/**
 * 대리점 검색 요청 감지
 * - 챗봇이 "대리점 추천해드릴까요?" 또는 "지역을 알려주세요" 질문을 한 경우
 * - 사용자가 명시적으로 위치를 입력한 경우
 */
function shouldSearchStores(recentMessages: any[], currentMessage: string): boolean {
  // 최근 3개 메시지만 확인 (너무 넓은 범위 방지)
  const lastAssistantMessage = recentMessages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content || ''

  // 챗봇이 대리점 추천이나 위치 질문을 했는지 확인
  const botAskedForLocation =
    (lastAssistantMessage.includes('대리점') && (
      lastAssistantMessage.includes('추천') ||
      lastAssistantMessage.includes('안내') ||
      lastAssistantMessage.includes('찾아') ||
      lastAssistantMessage.includes('방문')
    )) ||
    (lastAssistantMessage.includes('?') && (
      lastAssistantMessage.includes('어느 지역') ||
      lastAssistantMessage.includes('어디') ||
      lastAssistantMessage.includes('지역이신가요') ||
      lastAssistantMessage.includes('위치')
    ))

  // 사용자가 거부 의사를 표현했는지 확인
  const isRejection =
    currentMessage.includes('아니') ||
    currentMessage.includes('괜찮') ||
    currentMessage.includes('됐') ||
    currentMessage.includes('필요없') ||
    currentMessage.includes('안 할게') ||
    currentMessage.includes('안할게')

  // 실제 한국 지역명 패턴 (엄격한 검증)
  const isValidLocation =
    currentMessage.length >= 2 &&
    currentMessage.length < 20 &&
    !currentMessage.includes('?') &&
    !isRejection &&
    (
      // 지역명으로 끝나는 패턴
      /[가-힣]+(동|구|시|군|읍|면|역|로|길|가|리)$/.test(currentMessage.trim()) ||
      // 또는 "강남역", "이촌1동" 같은 패턴
      /^[가-힣]+\d*[동구시군역]$/.test(currentMessage.trim()) ||
      // "서울 강남구", "용산구 이촌동" 같은 패턴
      /^[가-힣\s]+(동|구|시|군|읍|면|역)$/.test(currentMessage.trim())
    )

  console.log('Store search check:', {
    botAskedForLocation,
    isValidLocation,
    isRejection,
    message: currentMessage,
    lastAssistantMsg: lastAssistantMessage.substring(0, 100)
  })

  return botAskedForLocation && isValidLocation && !isRejection
}

export async function POST(request: Request) {
  try {
    const { conversationId, message } = await request.json()

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await saveMessage(conversationId, 'user', message)

    // Get conversation history
    const conversationHistory = await getConversationMessages(conversationId)

    // 대리점 검색 요청 감지
    let storeSearchResults = ''
    const shouldSearch = shouldSearchStores(conversationHistory, message)

    if (shouldSearch) {
      console.log('🔍 Searching stores for:', message)
      const stores = await searchSKTStores(message)
      storeSearchResults = formatStoreResults(stores)
      console.log('✅ Store search results:', storeSearchResults.substring(0, 100))
    }

    const context = await retrieveContext(message)

    // 대리점 검색 결과를 컨텍스트에 추가
    let finalContext = context
    if (storeSearchResults) {
      finalContext = `${context}\n\n===== 대리점 검색 결과 (반드시 사용하세요) =====\n${storeSearchResults}\n\n위 대리점 검색 결과를 사용자에게 그대로 전달하세요.`
    }

    const systemPrompt = buildChatSystemPrompt(finalContext)

    // Build messages array with full conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
    ]

    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const assistantMessage = response.choices[0].message.content || '죄송합니다. 응답을 생성할 수 없습니다.'

    const savedMessage = await saveMessage(conversationId, 'assistant', assistantMessage)

    // 대리점 검색 결과가 있으면 함께 반환
    const responseData: any = {
      response: assistantMessage,
      messageId: savedMessage.id,
    }

    if (shouldSearch && storeSearchResults) {
      // 실제 검색된 대리점 정보를 함께 반환
      const stores = await searchSKTStores(message)
      // 검색 결과가 실제로 있을 때만 모달 표시
      if (stores && stores.length > 0) {
        responseData.stores = stores
        responseData.searchLocation = message
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
