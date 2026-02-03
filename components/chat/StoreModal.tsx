'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import type { StoreInfo } from '@/lib/utils/storeSearch'

interface StoreModalProps {
  isOpen: boolean
  onClose: () => void
  stores: StoreInfo[]
  location: string
  storeImageUrl?: string  // 대리점 이미지 URL (선택적)
}

export function StoreModal({ isOpen, onClose, stores, location, storeImageUrl = '/images/store-default.jpg' }: StoreModalProps) {
  const [selectedStore, setSelectedStore] = useState<number | null>(0)

  const handleStoreClick = (index: number) => {
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
          {/* 이미지 영역 */}
          <div className="order-1 md:order-2">
            <div className="relative w-full h-[400px] rounded-lg border overflow-hidden bg-gray-100">
              <Image
                src={storeImageUrl}
                alt="SKT 대리점 안내"
                fill
                className="object-cover"
                priority
              />
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
