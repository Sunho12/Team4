'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConversationTimeline } from '@/components/agency/ConversationTimeline'
import { PredictionScoreCard } from '@/components/agency/PredictionScoreCard'
import { format } from 'date-fns'

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.customerId as string

  const [customer, setCustomer] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authChecked) {
      loadCustomerData()
    }
  }, [customerId, authChecked])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')

      if (!response.ok) {
        router.push(`/auth/login?returnUrl=/customers/${customerId}`)
        return
      }

      const data = await response.json()
      const userRole = data.user.role

      if (userRole !== 'admin' && userRole !== 'agency_staff') {
        alert('권한이 없습니다. 대리점 직원만 접근할 수 있습니다.')
        router.push('/chat')
        return
      }

      setAuthChecked(true)
    } catch (error) {
      router.push(`/auth/login?returnUrl=/customers/${customerId}`)
    }
  }

  const loadCustomerData = async () => {
    try {
      const response = await fetch(`/api/agency/customer/${customerId}`)

      if (response.ok) {
        const data = await response.json()
        setCustomer(data.session)
        setPredictions(data.predictions || [])
      }
    } catch (error) {
      console.error('Failed to load customer data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzePurchaseIntent = async () => {
    setIsPredicting(true)

    try {
      const response = await fetch('/api/agency/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: customerId }),
      })

      if (response.ok) {
        const data = await response.json()
        setPredictions(data.predictions)
      }
    } catch (error) {
      console.error('Failed to analyze purchase intent:', error)
    } finally {
      setIsPredicting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">고객 정보를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{customer.customer_name || '이름 없음'}</CardTitle>
          <CardDescription>{customer.customer_phone || '전화번호 없음'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">가입일</p>
              <p>{format(new Date(customer.created_at), 'yyyy-MM-dd')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 상담 수</p>
              <p>{customer.conversations?.length || 0}건</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">구매 의향 분석</h2>
          <Button onClick={analyzePurchaseIntent} disabled={isPredicting}>
            {isPredicting ? '분석 중...' : '새로 분석하기'}
          </Button>
        </div>

        {predictions.length > 0 ? (
          <div className="grid gap-4">
            {predictions.map((prediction) => (
              <PredictionScoreCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                구매 의향 분석 결과가 없습니다. 위 버튼을 눌러 분석을 시작하세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">상담 이력</h2>
        {customer.conversations && customer.conversations.length > 0 ? (
          <ConversationTimeline conversations={customer.conversations} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">상담 이력이 없습니다</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
