import { NextResponse } from 'next/server'
import { getCustomerDetail } from '@/lib/services/customerService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params

    const data = await getCustomerDetail(customerId)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching customer detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer detail' },
      { status: 500 }
    )
  }
}
