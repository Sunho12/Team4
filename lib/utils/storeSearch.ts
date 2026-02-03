// SKT 대리점 검색 유틸리티 (카카오 로컬 API)

export interface StoreInfo {
  name: string
  address: string
  phone: string
  category: string
  roadAddress: string
  mapx: string // 경도
  mapy: string // 위도
  distance?: string // 거리 (미터)
}

/**
 * 카카오 로컬 API로 SKT 대리점 검색
 * @param location 지역명 (예: 이촌1동, 강남구 역삼동)
 * @returns 대리점 정보 배열 (최대 5개)
 */
export async function searchSKTStores(location: string): Promise<StoreInfo[]> {
  console.log('🔍 [Kakao] Searching stores for location:', location)

  const kakaoApiKey = process.env.KAKAO_REST_API_KEY

  if (!kakaoApiKey || kakaoApiKey === 'your_kakao_api_key_here') {
    console.warn('⚠️ Kakao API key not configured, using mock data')
    return getMockStores(location)
  }

  try {
    // 카카오 로컬 API 키워드 검색
    const queries = [
      `${location} SK텔레콤`,
      `${location} T world`,
      `${location} SKT 대리점`,
      `${location} T월드`,
    ]

    const allResults: StoreInfo[] = []

    for (const query of queries) {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodedQuery}&size=15`

      console.log('📡 Searching:', query)

      const response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${kakaoApiKey}`,
        },
      })

      if (!response.ok) {
        console.error('❌ Kakao API error:', response.status)
        const errorText = await response.text()
        console.error('Error details:', errorText)
        continue
      }

      const data = await response.json()

      if (data.documents && data.documents.length > 0) {
        console.log(`✅ Found ${data.documents.length} results for: ${query}`)

        const stores: StoreInfo[] = data.documents.map((item: any) => ({
          name: item.place_name,
          address: item.address_name,
          phone: item.phone || '전화번호 없음',
          category: item.category_name,
          roadAddress: item.road_address_name || item.address_name,
          mapx: item.x, // 경도
          mapy: item.y, // 위도
          distance: item.distance ? `${Math.round(parseInt(item.distance))}m` : undefined,
        }))

        allResults.push(...stores)
      }
    }

    // 중복 제거 (이름 기준)
    const uniqueStores = Array.from(
      new Map(allResults.map(store => [store.name, store])).values()
    )

    console.log('✅ Total unique stores found:', uniqueStores.length)

    // 결과가 없으면 mock 데이터 반환
    if (uniqueStores.length === 0) {
      console.log('⚠️ No results found, using mock data')
      return getMockStores(location)
    }

    // 상위 5개만 반환
    return uniqueStores.slice(0, 5)
  } catch (error) {
    console.error('❌ Error searching stores:', error)
    return getMockStores(location)
  }
}

/**
 * Mock 데이터 (API 키가 없을 때 사용)
 */
function getMockStores(location: string): StoreInfo[] {
  const mockData: StoreInfo[] = [
    {
      name: `T world ${location} 직영점`,
      address: `${location} 주요 상권 1층`,
      phone: '1599-0011',
      category: '통신서비스 > 이동통신',
      roadAddress: `${location} 중심가`,
      mapx: '127.0',
      mapy: '37.5',
      distance: '200m',
    },
    {
      name: `SK텔레콤 ${location}점`,
      address: `${location} 대로변`,
      phone: '1599-0011',
      category: '통신서비스 > 이동통신',
      roadAddress: `${location} 메인 거리`,
      mapx: '127.0',
      mapy: '37.5',
      distance: '450m',
    },
    {
      name: `T world 다이렉트샵 ${location}`,
      address: `${location} 역 근처`,
      phone: '1599-0011',
      category: '통신서비스 > 이동통신',
      roadAddress: `${location} 역 앞`,
      mapx: '127.0',
      mapy: '37.5',
      distance: '600m',
    },
  ]

  console.log('📦 Using mock data for:', location)
  return mockData
}

/**
 * 대리점 검색 결과를 텍스트로 포맷팅
 */
export function formatStoreResults(stores: StoreInfo[]): string {
  if (stores.length === 0) {
    return '죄송합니다. 해당 지역의 대리점 정보를 찾을 수 없습니다.'
  }

  let result = '다음은 근처 SKT 대리점 정보입니다:\n\n'

  stores.forEach((store, index) => {
    result += `📍 **${index + 1}. ${store.name}**\n`
    result += `   - 주소: ${store.address}\n`
    if (store.distance) {
      result += `   - 거리: ${store.distance}\n`
    }
    if (store.phone && store.phone !== '전화번호 없음') {
      result += `   - 전화: ${store.phone}\n`
    }
    result += `   - 분류: ${store.category}\n`
    result += '\n'
  })

  return result
}
