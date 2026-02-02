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

  useEffect(() => {
    if (!isOpen || stores.length === 0 || !mapRef.current) return

    // 카카오맵 SDK 로드 확인
    if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        initializeMap()
      })
    }
  }, [isOpen, stores])

  const initializeMap = () => {
    if (!mapRef.current || stores.length === 0) return

    // 첫 번째 대리점 위치를 중심으로 설정
    const firstStore = stores[0]
    const centerLat = parseFloat(firstStore.mapy)
    const centerLng = parseFloat(firstStore.mapx)

    const container = mapRef.current
    const options = {
      center: new window.kakao.maps.LatLng(centerLat, centerLng),
      level: 5, // 확대 레벨
    }

    const kakaoMap = new window.kakao.maps.Map(container, options)
    setMap(kakaoMap)

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // 모든 대리점에 마커 추가
    const bounds = new window.kakao.maps.LatLngBounds()

    stores.forEach((store, index) => {
      const lat = parseFloat(store.mapy)
      const lng = parseFloat(store.mapx)
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
        markersRef.current.forEach((m, i) => {
          if (m.infowindow) {
            m.infowindow.close()
          }
        })
        infowindow.open(kakaoMap, marker)
        setSelectedStore(index)
      })

      markersRef.current.push({ marker, infowindow })
      bounds.extend(position)
    })

    // 모든 마커가 보이도록 지도 범위 설정
    kakaoMap.setBounds(bounds)

    // 첫 번째 마커의 인포윈도우 자동 열기
    if (markersRef.current.length > 0) {
      markersRef.current[0].infowindow.open(kakaoMap, markersRef.current[0].marker)
      setSelectedStore(0)
    }
  }

  const handleStoreClick = (index: number) => {
    if (!map || !markersRef.current[index]) return

    const store = stores[index]
    const position = new window.kakao.maps.LatLng(
      parseFloat(store.mapy),
      parseFloat(store.mapx)
    )

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
            <div
              ref={mapRef}
              className="w-full h-[400px] rounded-lg border"
              style={{ minHeight: '400px' }}
            />
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
