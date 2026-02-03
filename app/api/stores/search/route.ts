import { NextResponse } from 'next/server'
import { searchSKTStores } from '@/lib/utils/storeSearch'

export async function POST(request: Request) {
  try {
    const { location } = await request.json()

    if (!location || !location.trim()) {
      return NextResponse.json(
        { error: '위치 정보가 필요합니다' },
        { status: 400 }
      )
    }

    console.log('[Store Search API] Searching for location:', location)

    // 대리점 검색
    const stores = await searchSKTStores(location)

    console.log('[Store Search API] Found stores:', stores.length)

    return NextResponse.json({
      stores,
      location,
    })
  } catch (error) {
    console.error('[Store Search API] Error:', error)
    return NextResponse.json(
      { error: '대리점 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
