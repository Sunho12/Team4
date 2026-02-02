import { NextResponse } from 'next/server'
import { getRecentCustomers } from '@/lib/services/customerService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 5

    const recentCustomers = await getRecentCustomers(limit)

    return NextResponse.json({
      customers: recentCustomers,
    })
  } catch (error) {
    console.error('Error fetching recent customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent customers' },
      { status: 500 }
    )
  }
}
