'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function FamilyCombineApplyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/Tworld/T.png"
              alt="T world"
              width={32}
              height={32}
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
            <h1 className="text-xl font-bold text-[#3617CE]">가족결합 신청</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => window.close()}
          >
            닫기
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-3xl font-bold mb-2">가족결합 신청</h2>
            <p className="text-gray-600">
              가족과 함께 더 큰 혜택을 누리세요
            </p>
          </div>

          <div className="space-y-6">
            {/* 할인 혜택 */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-[#3617CE]">💰 할인 혜택</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>2회선: 월 5,000원 할인</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>3회선: 월 10,000원 할인</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>4회선 이상: 월 15,000원 할인</span>
                </li>
              </ul>
            </div>

            {/* 회선 정보 */}
            <div className="border p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">📱 회선 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">주 회선</span>
                  <span className="font-semibold">010-1234-5678</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">요금제</span>
                  <span className="font-semibold">5GX 프리미엄</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">월 요금</span>
                  <span className="font-semibold">109,000원</span>
                </div>
              </div>
            </div>

            {/* 추가 회선 안내 */}
            <div className="border-2 border-dashed border-purple-300 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-3">➕ 추가 회선</h3>
              <p className="text-gray-600 mb-4">
                가족 구성원의 회선을 추가하시려면 아래 정보를 입력해주세요.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="전화번호 (예: 010-1234-5678)"
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="가입자 이름"
                  className="w-full p-3 border rounded-lg"
                />
                <select className="w-full p-3 border rounded-lg">
                  <option>가족 관계 선택</option>
                  <option>배우자</option>
                  <option>자녀</option>
                  <option>부모</option>
                  <option>형제/자매</option>
                </select>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.close()}
              >
                나중에 신청
              </Button>
              <Button
                className="flex-1 bg-[#3617CE] hover:bg-[#2a11a3] text-white"
                onClick={() => {
                  alert('가족결합 신청이 완료되었습니다!')
                  window.close()
                }}
              >
                신청하기
              </Button>
            </div>
          </div>
        </Card>

        {/* 안내사항 */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-yellow-800">📌 안내사항</h4>
          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• 가족결합은 최대 6회선까지 가능합니다.</li>
            <li>• 가족관계증명서 또는 주민등록등본으로 가족관계를 확인합니다.</li>
            <li>• 할인은 다음 달부터 적용됩니다.</li>
            <li>• 자세한 내용은 고객센터(1599-0011)로 문의하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
