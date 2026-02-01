'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">대리점 로그인</CardTitle>
          <CardDescription>
            대리점 직원 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            현재는 인증 기능이 구현되지 않았습니다.
            Supabase Auth를 설정한 후 이메일/비밀번호 로그인을 사용할 수 있습니다.
          </p>

          <div className="space-y-2">
            <Link href="/search">
              <Button className="w-full">데모: 고객 검색 페이지로 이동</Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full">홈으로 돌아가기</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
