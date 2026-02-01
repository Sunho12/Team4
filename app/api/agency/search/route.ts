import { NextResponse } from 'next/server'
import { searchCustomers } from '@/lib/services/customerService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Missing search query' },
        { status: 400 }
      )
    }

    const customers = await searchCustomers(query)

    return NextResponse.json({
      customers,
    })
  } catch (error) {
    console.error('Error searching customers:', error)
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    )
  }
}
