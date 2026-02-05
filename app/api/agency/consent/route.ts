import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { conversationId, consent } = await request.json()

    if (!conversationId || typeof consent !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing conversationId or consent' },
        { status: 400 }
      )
    }

    console.log('[Consent API] Saving consent:', { conversationId, consent })

    const supabase = await createServiceRoleClient()

    // conversation_summaries 테이블에 consent 필드 업데이트
    const { error } = await supabase
      .from('conversation_summaries')
      .update({
        agency_consent: consent,
        consent_updated_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('[Consent API] Failed to save consent:', error)
      return NextResponse.json(
        { error: 'Failed to save consent' },
        { status: 500 }
      )
    }

    console.log('[Consent API] Consent saved successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Consent API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
