import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLES = [
  'customer_demographics',
  'purchase_history',
  'customer_devices',
  'family_members',
  'app_usage_metrics'
]

async function getTableSchema(tableName: string) {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `
  })

  if (error) {
    // RPC가 없으면 빈 쿼리로 컬럼 정보 가져오기
    const { error: selectError } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)

    if (selectError) {
      console.log(`   ⚠️  테이블을 조회할 수 없습니다: ${selectError.message}`)
      return null
    }

    console.log(`   ℹ️  RPC를 사용할 수 없어 상세 스키마 정보를 가져올 수 없습니다.`)
    return null
  }

  return data
}

async function checkAllSchemas() {
  console.log('📊 테이블 스키마 조회 중...\n')
  console.log('='.repeat(80))

  for (const tableName of TABLES) {
    console.log(`\n📋 ${tableName.toUpperCase()}`)
    console.log('-'.repeat(80))

    const schema = await getTableSchema(tableName)

    if (schema && Array.isArray(schema) && schema.length > 0) {
      schema.forEach((col: any) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const dataType = col.character_maximum_length
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''

        console.log(`  • ${col.column_name}`)
        console.log(`    타입: ${dataType} ${nullable}${defaultVal}`)
      })
    } else {
      // 샘플 데이터로 스키마 추정
      const { data: sample, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`   ❌ 오류: ${error.message}`)
      } else if (sample && sample.length > 0) {
        console.log('   샘플 데이터 기반 컬럼:')
        Object.keys(sample[0]).forEach(key => {
          const value = sample[0][key]
          const type = value === null ? 'unknown' : typeof value
          console.log(`  • ${key}: ${type}`)
        })
      } else {
        console.log('   테이블이 비어있습니다. 스키마를 직접 확인해주세요.')
      }
    }
  }

  console.log('\n' + '='.repeat(80))
}

checkAllSchemas()
  .then(() => {
    console.log('\n✅ 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 오류:', error)
    process.exit(1)
  })
