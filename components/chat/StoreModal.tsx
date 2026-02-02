'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { StoreInfo } from '@/lib/utils/storeSearch'

interface StoreModalProps {
  isOpen: boolean
  onClose: () => void
  stores: StoreInfo[]
  location: string
}

declare global {
  interface Window {
    kakao: any
  }
}

export function StoreModal({ isOpen, onClose, stores, location }: StoreModalProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [map, setMap] = useState<any>(null)
  const markersRef = useRef<any[]>([])
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [sdkError, setSdkError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || stores.length === 0 || !mapRef.current) {
      console.debug('[StoreModal] Skipping: isOpen=', isOpen, 'stores.length=', stores.length, 'mapRef.current=', !!mapRef.current)
      return
    }

    console.log('[StoreModal] ===== Starting Kakao Map Load =====')
    console.log('[StoreModal] Stores count:', stores.length)
    console.log('[StoreModal] First store:', stores[0])

    setSdkError(null)
    setSdkLoaded(false)

    const loadAndInitMap = () => {
      const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
      console.log('[StoreModal] API Key exists:', !!key)

      if (!key) {
        console.error('[StoreModal] No API key')
        setSdkError('카카오 지도 API 키가 설정되지 않았습니다.')
        return
      }

      // 1. SDK가 이미 완전히 로드되어 있는 경우
      if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
        console.log('[StoreModal] ✅ Kakao SDK already fully loaded')
        setSdkLoaded(true)
        initializeMap()
        return
      }

      // 2. 스크립트는 있지만 maps가 아직 준비 안 된 경우
      if (window.kakao && !window.kakao.maps) {
        console.log('[StoreModal] ⏳ Kakao loaded but maps not ready, waiting...')
        let attempts = 0
        const checkInterval = setInterval(() => {
          attempts++
          console.log(`[StoreModal] Checking maps API... attempt ${attempts}`)
          if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
            console.log('[StoreModal] ✅ Kakao maps now ready')
            clearInterval(checkInterval)
            setSdkLoaded(true)
            initializeMap()
          }
          if (attempts > 50) {
            clearInterval(checkInterval)
            setSdkError('카카오 지도 로딩 시간 초과')
          }
        }, 200)
        return
      }

      // 3. 스크립트 태그가 이미 있는 경우 제거하고 재생성
      const existing = document.getElementById('kakao-sdk')
      if (existing) {
        console.log('[StoreModal] Removing existing script')
        existing.remove()
      }

      // 4. 새 스크립트 생성 (autoload=true로 자동 초기화)
      console.log('[StoreModal] Creating new script tag with autoload=true')
      const script = document.createElement('script')
      script.id = 'kakao-sdk'
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=true`
      script.async = false

      script.onload = () => {
        console.log('[StoreModal] ✅ Script loaded with autoload=true')
        // autoload=true이므로 바로 사용 가능
        if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
          console.log('[StoreModal] ✅ Maps API ready, initializing map')
          setSdkLoaded(true)
          setTimeout(() => initializeMap(), 100)
        } else {
          // 짧은 대기 후 재시도
          console.log('[StoreModal] ⏳ Waiting for maps API...')
          setTimeout(() => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
              console.log('[StoreModal] ✅ Maps API ready after wait')
              setSdkLoaded(true)
              initializeMap()
            } else {
              console.error('[StoreModal] ❌ Maps API still not ready')
              setSdkError('카카오 지도 API 초기화 실패')
            }
          }, 500)
        }
      }

      script.onerror = (e) => {
        console.error('[StoreModal] ❌ Script load error:', e)
        setSdkError('카카오 지도 스크립트 로드 실패')
      }

      document.head.appendChild(script)
      console.log('[StoreModal] Script tag added to document')
    }

    loadAndInitMap()

    return () => {
      // Cleanup
      console.log('[StoreModal] Cleanup')
      try {
        markersRef.current.forEach(m => m.marker?.setMap(null))
        markersRef.current = []
      } catch (e) {
        console.error('[StoreModal] Cleanup error:', e)
      }
    }
  }, [isOpen, stores])

  const initializeMap = () => {
    console.log('[StoreModal] ===== initializeMap START =====')
    console.log('[StoreModal] mapRef.current:', !!mapRef.current)
    console.log('[StoreModal] stores.length:', stores.length)
    console.log('[StoreModal] window.kakao:', !!window.kakao)
    console.log('[StoreModal] window.kakao.maps:', !!(window.kakao && window.kakao.maps))
    console.log('[StoreModal] window.kakao.maps.LatLng:', !!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng))

    if (!mapRef.current || stores.length === 0) {
      console.error('[StoreModal] ❌ Cannot initialize: mapRef or stores empty')
      return
    }

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
      console.error('[StoreModal] ❌ Kakao maps SDK not ready')
      setSdkError('카카오 지도 SDK를 찾을 수 없습니다.')
      return
    }

    // 첫 번째 대리점 위치를 중심으로 설정
    const firstStore = stores[0]
    console.log('[StoreModal] First store data:', firstStore)

    const centerLat = parseFloat(firstStore.mapy)
    const centerLng = parseFloat(firstStore.mapx)
    console.log('[StoreModal] Parsed coordinates:', { centerLat, centerLng })

    // 좌표 유효성 검사 (한국 좌표 범위 확인)
    const isValidKoreanCoordinate =
      isFinite(centerLat) && isFinite(centerLng) &&
      centerLat >= 33 && centerLat <= 43 &&
      centerLng >= 124 && centerLng <= 132

    if (!isValidKoreanCoordinate) {
      console.error('[StoreModal] ❌ Invalid coordinates:', { centerLat, centerLng })
      setSdkError('유효하지 않은 좌표입니다.')
      return
    }

    console.log('[StoreModal] ✅ Coordinates valid:', { centerLat, centerLng })

    const container = mapRef.current
    console.log('[StoreModal] Container element:', container)

    try {
      const center = new window.kakao.maps.LatLng(centerLat, centerLng)
      console.log('[StoreModal] ✅ LatLng created:', center)

      const options = {
        center: center,
        level: 5,
      }
      console.log('[StoreModal] Map options:', options)

      const kakaoMap = new window.kakao.maps.Map(container, options)
      console.log('[StoreModal] ✅ Map object created:', kakaoMap)

      setMap(kakaoMap)
      console.log('[StoreModal] ✅✅✅ Map initialized successfully! =====')
    } catch (error) {
      console.error('[StoreModal] ❌ Error creating map:', error)
      setSdkError(`지도 생성 실패: ${error}`)
      return
    }

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.marker.setMap(null))
    markersRef.current = []

    // 모든 대리점에 마커 추가
    const bounds = new window.kakao.maps.LatLngBounds()

    stores.forEach((store, index) => {
      const lat = parseFloat(store.mapy)
      const lng = parseFloat(store.mapx)

      // 좌표가 유효하지 않으면 건너뜀
      if (!isFinite(lat) || !isFinite(lng)) {
        console.warn(`[StoreModal] Invalid coordinates for store ${index}:`, store)
        return
      }

      // 한국 좌표 범위 체크
      if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
        console.warn(`[StoreModal] Out of range coordinates for store ${index}:`, { lat, lng })
        return
      }

      const position = new window.kakao.maps.LatLng(lat, lng)

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position,
        map: kakaoMap,
      })

      // 인포윈도우 내용
      const infoContent = `
        <div style="padding:10px;min-width:200px;">
          <div style="font-weight:bold;margin-bottom:5px;">${index + 1}. ${store.name}</div>
          <div style="font-size:12px;color:#666;">${store.address}</div>
          ${store.phone && store.phone !== '전화번호 없음'
            ? `<div style="font-size:12px;color:#666;margin-top:3px;">📞 ${store.phone}</div>`
            : ''}
        </div>
      `

      const infowindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
      })

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 다른 인포윈도우 닫기
        markersRef.current.forEach((m) => {
          if (m.infowindow) m.infowindow.close()
        })
        infowindow.open(kakaoMap, marker)
        setSelectedStore(index)
      })

      markersRef.current.push({ marker, infowindow })
      bounds.extend(position)
    })

    // 모든 마커가 보이도록 지도 범위 설정
    console.debug('[StoreModal] markers added:', markersRef.current.length)
    try {
      kakaoMap.setBounds(bounds)
    } catch (e) {
      // ignore if bounds fail
    }

    // 첫 번째 마커의 인포윈도우 자동 열기
    if (markersRef.current.length > 0) {
      markersRef.current[0].infowindow.open(kakaoMap, markersRef.current[0].marker)
      setSelectedStore(0)
    } else {
      console.debug('[StoreModal] No valid markers to display')
    }
  }

  const handleStoreClick = (index: number) => {
    if (!map || !markersRef.current[index]) {
      console.warn('[StoreModal] Cannot handle store click: map or marker not available')
      return
    }

    const store = stores[index]
    const lat = parseFloat(store.mapy)
    const lng = parseFloat(store.mapx)

    if (!isFinite(lat) || !isFinite(lng)) {
      console.error('[StoreModal] Invalid coordinates for clicked store:', store)
      return
    }

    const position = new window.kakao.maps.LatLng(lat, lng)

    // 지도 중심 이동
    map.setCenter(position)

    // 모든 인포윈도우 닫기
    markersRef.current.forEach(m => m.infowindow.close())

    // 선택한 마커의 인포윈도우 열기
    markersRef.current[index].infowindow.open(map, markersRef.current[index].marker)
    setSelectedStore(index)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            📍 {location} 근처 SKT 대리점
          </DialogTitle>
          <DialogDescription>
            총 {stores.length}곳의 대리점을 찾았습니다
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* 지도 영역 */}
          <div className="order-1 md:order-2">
            <div className="relative w-full h-[400px] rounded-lg border" style={{ minHeight: '400px' }}>
              <div ref={mapRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />

              {/* 로드 중 / 에러 상태 표시 */}
              {!sdkLoaded && !sdkError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <div className="text-sm text-muted-foreground">카카오 지도 로드 중...</div>
                  </div>
                </div>
              )}

              {sdkError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="text-red-500 text-4xl">⚠️</div>
                    <div className="text-sm text-red-600 font-medium">{sdkError}</div>
                    <div className="text-xs text-muted-foreground">브라우저 콘솔을 확인해주세요</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 대리점 리스트 */}
          <div className="order-2 md:order-1 space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {stores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                대리점 정보를 찾을 수 없습니다.
              </div>
            ) : (
              stores.map((store, index) => (
                <div
                  key={index}
                  onClick={() => handleStoreClick(index)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedStore === index
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:bg-accent hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex items-center justify-center min-w-[32px] h-8 rounded-full font-bold text-sm ${
                      selectedStore === index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base mb-1 truncate">{store.name}</h3>
                      <div className="space-y-1 text-xs">
                        <div className="text-muted-foreground truncate">
                          {store.address}
                        </div>
                        {store.phone && store.phone !== '전화번호 없음' && (
                          <div className="flex items-center gap-1">
                            <span>📞</span>
                            <a
                              href={`tel:${store.phone}`}
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {store.phone}
                            </a>
                          </div>
                        )}
                        {store.distance && (
                          <div className="text-muted-foreground">
                            📏 {store.distance}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
