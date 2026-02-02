'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import type { Message } from '@/types/chat'
import { FileText, CheckCircle2 } from 'lucide-react'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

// 마크다운 기호 제거 함수
function removeMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold** 제거
    .replace(/\*(.+?)\*/g, '$1') // *italic* 제거
    .replace(/\_\_(.+?)\_\_/g, '$1') // __bold__ 제거
    .replace(/\_(.+?)\_/g, '$1') // _italic_ 제거
    .replace(/\#+ /g, '') // # 헤더 제거
    .replace(/\-\s/g, '🔹 ') // - 리스트를 🔹로 변경
}

// 서류 안내 메시지인지 확인
function isDocumentMessage(content: string): boolean {
  return content.includes('방문하시기 전') ||
         content.includes('서류') ||
         content.includes('🔹')
}

// 서류 리스트 추출
function extractDocuments(content: string): string[] {
  const lines = content.split('\n')
  return lines
    .filter(line => line.trim().startsWith('🔹'))
    .map(line => line.replace('🔹', '').trim())
}

// 서류 카드 컴포넌트
function DocumentCard({ documents, message }: { documents: string[], message: string }) {
  const intro = message.split('🔹')[0].trim()

  return (
    <div className="space-y-3">
      {/* 안내 메시지 */}
      <p className="text-sm" style={{ color: '#222', fontFamily: "'SK Mobius', sans-serif" }}>
        {removeMarkdown(intro)}
      </p>

      {/* 글래스모피즘 서류 카드 */}
      <div
        className="rounded-2xl p-4 backdrop-blur-[10px] border-2"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#6B5FE5'
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6B5FE5' }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: "'SK Mobius', sans-serif", color: '#222' }}>
            필요 서류 체크리스트
          </span>
        </div>

        <div className="space-y-2">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-[#6B5FE5] flex-shrink-0 mt-0.5" />
              <span className="text-sm" style={{ fontFamily: "'SK Mobius', sans-serif", color: '#222' }}>
                {doc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-center" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
            안녕하세요! T-world 상담 챗봇이에요.
            <br />
            무엇을 도와드릴까요?
          </p>
        </div>
      )}

      {messages.map((message) => {
        const isDocument = message.role === 'assistant' && isDocumentMessage(message.content)
        const documents = isDocument ? extractDocuments(message.content) : []

        return (
          <div
            key={message.id}
            className={cn(
              'flex items-start gap-2',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {/* Assistant 캐릭터 */}
            {message.role === 'assistant' && (
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden"
                style={{ marginBottom: '4px' }}
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                  __html: `
                    <model-viewer
                      src="/Tworld/models/model_adot.glb"
                      camera-orbit="0deg 75deg 105%"
                      animation-name="*"
                      autoplay
                      loop
                      style="width: 100%; height: 100%; background-color: transparent;">
                    </model-viewer>
                  `
                }}
              />
            )}

            {/* 메시지 버블 */}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'text-white shadow-lg'
                  : 'bg-white shadow-md border border-gray-200'
              )}
              style={{
                fontFamily: "'SK Mobius', sans-serif",
                backgroundColor: message.role === 'user' ? '#6B5FE5' : undefined
              }}
            >
              {isDocument && documents.length > 0 ? (
                <DocumentCard documents={documents} message={message.content} />
              ) : (
                <p className="whitespace-pre-wrap" style={{ color: message.role === 'user' ? '#fff' : '#222' }}>
                  {removeMarkdown(message.content)}
                </p>
              )}
            </div>
          </div>
        )
      })}

      {isLoading && (
        <div className="flex justify-start items-start gap-2">
          {/* 로딩 중 캐릭터 */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden"
            style={{ marginBottom: '4px' }}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `
                <model-viewer
                  src="/Tworld/models/model_adot.glb"
                  camera-orbit="0deg 75deg 105%"
                  animation-name="*"
                  autoplay
                  loop
                  style="width: 100%; height: 100%; background-color: transparent;">
                </model-viewer>
              `
            }}
          />

          {/* 로딩 버블 */}
          <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white shadow-md border border-gray-200">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#6B5FE5' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#6B5FE5', animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#6B5FE5', animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
