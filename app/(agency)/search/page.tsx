'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/agency/search?q=${encodeURIComponent(query)}`)

      if (response.ok) {
        const data = await response.json()
        setResults(data.customers)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">고객 검색</h2>
        <p className="text-muted-foreground">고객 이름 또는 전화번호로 검색하세요</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="이름 또는 전화번호..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{results.length}명의 고객을 찾았습니다</p>

          {results.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{customer.customer_name || '이름 없음'}</CardTitle>
                      <CardDescription>{customer.customer_phone || '전화번호 없음'}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {customer.conversations?.length || 0}건의 상담
                    </Badge>
                  </div>
                </CardHeader>

                {customer.conversations && customer.conversations.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">최근 상담</p>
                      {customer.conversations.slice(0, 2).map((conv: any) => (
                        <div key={conv.id} className="text-sm">
                          <p className="text-muted-foreground">
                            {format(new Date(conv.started_at), 'yyyy-MM-dd HH:mm')}
                          </p>
                          {conv.conversation_summaries?.[0] && (
                            <p className="line-clamp-2">{conv.conversation_summaries[0].summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {results.length === 0 && query && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  )
}
