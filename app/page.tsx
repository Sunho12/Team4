import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="z-10 max-w-5xl w-full items-center justify-center">
        {/* T-Bridge 로고 */}
        <div className="flex flex-col items-center mb-12">
          <Image
            src="/t-bridge-logo.png"
            alt="T-Bridge Logo"
            width={500}
            height={150}
            priority
            className="mb-4"
          />
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg font-medium">
            초기화면
          </p>
        </div>

        {/* 고객사이트와 대리점사이트 링크 구분 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* 고객사이트: T-Bridge 상담 챗봇 */}
          <Link
            href="/chat"
            className="group rounded-xl border-2 border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-8 py-10 transition-all hover:border-red-400 hover:shadow-xl hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                고객사이트
              </h2>
              <h3 className="mb-3 text-2xl font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                T-Bridge 상담 챗봇
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-2 text-red-600">
                  →
                </span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                통신 업무 상담을 위한 AI 챗봇 서비스
              </p>
            </div>
          </Link>

          {/* 대리점사이트: 대리점 대시보드 */}
          <Link
            href="/auth/login"
            className="group rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-800 px-8 py-10 transition-all hover:border-orange-400 hover:shadow-xl hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                대리점사이트
              </h2>
              <h3 className="mb-3 text-2xl font-semibold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                대리점 대시보드
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-2 text-orange-600">
                  →
                </span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                고객 검색 및 상담 내역 조회
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
