import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { summary } = await request.json()

    if (!summary) {
      return NextResponse.json(
        { error: 'Summary is required' },
        { status: 400 }
      )
    }

    // OpenAI로 15자 이내 짧은 요약 생성
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `당신은 상담 내용을 매우 짧게 요약하는 전문가입니다.
주어진 상담 요약을 15자 이내로 핵심만 추출하여 요약하세요.
예시:
- "고객이 데이터 사용량 증가로 인한 요금제 변경 상담을 요청함" → "요금제 변경 문의"
- "단말기 할부 이율 및 잔여 기간에 대한 문의" → "단말기 할부 문의"
- "청구서 내역에 대한 문의 및 요금 설명 요청" → "청구서 문의"

반드시 15자 이내로만 작성하고, 핵심 키워드만 포함하세요.
문장이 아닌 키워드 형태로 작성하세요.`
        },
        {
          role: 'user',
          content: summary
        }
      ],
      temperature: 0.3,
      max_tokens: 50,
    })

    const shortSummary = response.choices[0]?.message?.content?.trim() || summary.substring(0, 15)

    return NextResponse.json({ shortSummary })
  } catch (error) {
    console.error('[Short Summary API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate short summary' },
      { status: 500 }
    )
  }
}
