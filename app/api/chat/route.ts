import { NextResponse } from 'next/server'
import { saveMessage, getConversationMessages } from '@/lib/services/chatService'
import { openai, MODELS } from '@/lib/ai/openai'
import { retrieveContext } from '@/lib/ai/rag'
import { buildChatSystemPrompt } from '@/lib/ai/prompts'
import { searchSKTStores, formatStoreResults } from '@/lib/utils/storeSearch'

/**
 * 대리점 검색 요청 감지
 * - 이전 메시지에 "대리점" 또는 "지역" 키워드가 있고
 * - 현재 메시지가 지역명으로 보이는 경우
 */
function shouldSearchStores(recentMessages: any[], currentMessage: string): boolean {
  // 최근 3개 메시지 확인
  const recentContent = recentMessages
    .slice(-3)
    .map(m => m.content)
    .join(' ')

  const hasStoreKeyword =
    recentContent.includes('대리점') ||
    recentContent.includes('지역') ||
    recentContent.includes('추천')

  // 현재 메시지가 지역명으로 보이는지 (더 관대하게)
  const looksLikeLocation =
    currentMessage.length < 30 &&
    (currentMessage.includes('동') ||
     currentMessage.includes('구') ||
     currentMessage.includes('로') ||
     currentMessage.includes('역') ||
     /^[가-힣\s]+$/.test(currentMessage)) && // 한글만 포함
    !currentMessage.includes('?') && // 질문이 아님
    !currentMessage.includes('네') && // "네"가 아님
    !currentMessage.includes('아니')

  console.log('Store search check:', { hasStoreKeyword, looksLikeLocation, message: currentMessage })

  return hasStoreKeyword && looksLikeLocation
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
      responseData.stores = stores
      responseData.searchLocation = message
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
