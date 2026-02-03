import { NextResponse } from 'next/server'
import { analyzePurchaseIntent } from '@/lib/ai/predict'

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      )
    }

    console.log('[Predict API] Analyzing session:', sessionId)

    const analysisResult = await analyzePurchaseIntent(sessionId)

    console.log('[Predict API] Analysis complete:', analysisResult)

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('[Predict API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}
