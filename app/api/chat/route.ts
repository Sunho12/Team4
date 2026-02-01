import { NextResponse } from 'next/server'
import { saveMessage } from '@/lib/services/chatService'
import { openai, MODELS } from '@/lib/ai/openai'
import { retrieveContext } from '@/lib/ai/rag'
import { buildChatSystemPrompt } from '@/lib/ai/prompts'

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

    const context = await retrieveContext(message)

    const systemPrompt = buildChatSystemPrompt(context)

    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const assistantMessage = response.choices[0].message.content || '죄송합니다. 응답을 생성할 수 없습니다.'

    const savedMessage = await saveMessage(conversationId, 'assistant', assistantMessage)

    return NextResponse.json({
      response: assistantMessage,
      messageId: savedMessage.id,
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
