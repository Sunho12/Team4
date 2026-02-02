import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const supabase = await createClient()

    // 1. Get customer_sessions for this profile (user_id)
    const { data: sessions, error: sessionError } = await supabase
      .from('customer_sessions')
      .select('id')
      .eq('user_id', customerId)

    if (sessionError) {
      console.error('Error fetching customer sessions:', sessionError)
      return NextResponse.json(
        { error: 'Failed to fetch customer sessions', conversations: [] },
        { status: 500 }
      )
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const sessionIds = sessions.map(s => s.id)

    // 2. Get conversations for these sessions
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        session_id,
        status,
        started_at,
        ended_at,
        created_at
      `)
      .in('session_id', sessionIds)
      .order('started_at', { ascending: false })

    if (convError) {
      console.error('Error fetching conversations:', convError)
      return NextResponse.json(
        { error: 'Failed to fetch conversations', conversations: [] },
        { status: 500 }
      )
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // 3. For each conversation, get messages and summary
    const conversationsWithData = await Promise.all(
      conversations.map(async (conv) => {
        // Get messages
        const { data: messages } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true })

        // Get summary (주요 데이터: summary, category, sentiment)
        const { data: summaries } = await supabase
          .from('conversation_summaries')
          .select('summary, category, keywords, sentiment')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)

        return {
          ...conv,
          messages: messages || [],
          summary: summaries && summaries.length > 0 ? summaries[0] : null
        }
      })
    )

    return NextResponse.json({
      conversations: conversationsWithData
    })

  } catch (error) {
    console.error('Error in conversations API:', error)
    return NextResponse.json(
      { error: 'Internal server error', conversations: [] },
      { status: 500 }
    )
  }
}
