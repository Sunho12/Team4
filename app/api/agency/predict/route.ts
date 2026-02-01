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

    const predictions = await analyzePurchaseIntent(sessionId)

    return NextResponse.json({
      predictions,
    })
  } catch (error) {
    console.error('Error generating predictions:', error)
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}
