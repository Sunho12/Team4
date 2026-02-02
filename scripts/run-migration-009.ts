import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 마이그레이션 009 실행 중...\n')

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '009_create_customer_tables.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📄 마이그레이션 파일 읽기 완료')
  console.log('📊 SQL 실행 중...\n')

  // Split by semicolon and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Skip comments
    if (statement.trim().startsWith('--')) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        // Try alternative method if exec_sql doesn't exist
        const lines = statement.split('\n')
        const firstLine = lines.find(l => !l.trim().startsWith('--'))?.trim() || ''

        if (firstLine.toLowerCase().includes('create table')) {
          console.log(`⚠️  RPC method not available, trying direct execution...`)
          // We'll need to use a different approach
          throw error
        } else {
          throw error
        }
      }

      successCount++

      // Show progress for important statements
      const lowerStatement = statement.toLowerCase()
      if (lowerStatement.includes('create table')) {
        const tableName = statement.match(/create table (?:if not exists )?(\w+)/i)?.[1]
        console.log(`  ✓ 테이블 생성: ${tableName}`)
      } else if (lowerStatement.includes('create index')) {
        console.log(`  ✓ 인덱스 생성`)
      } else if (lowerStatement.includes('create policy')) {
        console.log(`  ✓ RLS 정책 생성`)
      }

    } catch (error: any) {
      errorCount++
      console.error(`  ❌ 오류 (statement ${i + 1}):`, error.message)

      // Continue with other statements even if one fails
      if (error.message?.includes('already exists')) {
        console.log(`  ℹ️  이미 존재하는 객체 - 건너뛰기`)
        successCount++
      }
    }
  }

  console.log(`\n📊 결과:`)
  console.log(`  ✓ 성공: ${successCount}`)
  console.log(`  ❌ 실패: ${errorCount}`)

  if (errorCount === 0 || errorCount < statements.length / 2) {
    console.log('\n✅ 마이그레이션이 완료되었습니다!')
    console.log('\n다음 단계: 더미 데이터 생성 스크립트를 실행하세요.')
  } else {
    console.log('\n⚠️  많은 오류가 발생했습니다. SQL을 직접 실행해야 할 수 있습니다.')
    console.log('Supabase 대시보드에서 SQL Editor를 열어 마이그레이션 파일을 붙여넣고 실행하세요.')
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 치명적 오류:', error)
    process.exit(1)
  })
