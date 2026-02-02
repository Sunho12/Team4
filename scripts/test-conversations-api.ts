import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testConversationsAPI() {
  console.log('🧪 Conversations API 테스트\n')

  // Get a customer ID
  const testCustomerId = '94d289fe-2501-4369-9bb8-252b02bb12e9' // 곽선호

  console.log(`📞 고객 ID: ${testCustomerId}`)
  console.log(`🔗 API 호출 중...\n`)

  try {
    const response = await fetch(
      `http://localhost:3000/api/agency/customer/${testCustomerId}/conversations`
    )

    if (!response.ok) {
      console.error(`❌ API 오류: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.error('응답 내용:', text)
      return
    }

    const data = await response.json()

    console.log('✅ API 응답 성공!\n')
    console.log(`📊 대화 개수: ${data.conversations?.length || 0}개\n`)

    if (data.conversations && data.conversations.length > 0) {
      data.conversations.forEach((conv: any, index: number) => {
        console.log(`\n[대화 ${index + 1}]`)
        console.log(`  ID: ${conv.id}`)
        console.log(`  상태: ${conv.status}`)
        console.log(`  시작: ${new Date(conv.started_at).toLocaleString('ko-KR')}`)

        if (conv.summary) {
          console.log(`  📝 요약:`)
          console.log(`    - 카테고리: ${conv.summary.category}`)
          console.log(`    - 감정: ${conv.summary.sentiment}`)
          console.log(`    - 내용: ${conv.summary.summary}`)
        } else {
          console.log(`  ⚠️  요약 없음`)
        }

        if (conv.messages) {
          console.log(`  💬 메시지: ${conv.messages.length}개`)
          if (conv.messages.length > 0) {
            const firstMsg = conv.messages[0]
            console.log(`    첫 메시지: [${firstMsg.role}] ${firstMsg.content.substring(0, 30)}...`)
          }
        }
      })
    } else {
      console.log('⚠️  대화 내역이 없습니다.')
    }

  } catch (error: any) {
    console.error('❌ 네트워크 오류:', error.message)
    console.log('\n💡 Next.js 개발 서버가 실행 중인지 확인하세요:')
    console.log('   npm run dev')
  }
}

testConversationsAPI()
  .then(() => {
    console.log('\n\n✨ 테스트 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 오류:', error)
    process.exit(1)
  })
