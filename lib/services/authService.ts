import { createServiceRoleClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface SignUpData {
  name: string
  password: string
  phoneNumber: string
}

export interface UserData {
  id: string
  name: string
  phoneNumber: string
  role: string
}

/**
 * Simple signup - use name as username
 */
export async function signUp(data: SignUpData): Promise<void> {
  const supabase = await createServiceRoleClient()

  // Check if name already exists (name is used as username)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', data.name)
    .single()

  if (existing) {
    throw new Error('이미 사용 중인 이름입니다')
  }

  // Insert new user - use name as username
  const { error } = await supabase
    .from('profiles')
    .insert({
      username: data.name, // Name as username for login
      password: data.password,
      full_name: data.name,
      phone_number: data.phoneNumber,
      role: 'customer',
    })

  if (error) {
    throw new Error(`회원가입 실패: ${error.message}`)
  }
}

/**
 * 고객 로그인 (tworld, chat 용)
 */
export async function signInCustomer(name: string, password: string): Promise<UserData> {
  const supabase = await createServiceRoleClient()

  console.log('[Customer] 로그인 시도:', { name })

  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role, username, password')
    .eq('username', name)
    .eq('password', password)
    .eq('role', 'customer') // 고객만
    .single()

  if (error || !user) {
    throw new Error('이름 또는 비밀번호가 올바르지 않습니다')
  }

  // 고객용 쿠키 설정
  const cookieStore = await cookies()
  cookieStore.set('customer_session', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  return {
    id: user.id,
    name: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
  }
}

/**
 * 대리점/관리자 로그인 (agency dashboard 용)
 */
export async function signInAgency(name: string, password: string): Promise<UserData> {
  const supabase = await createServiceRoleClient()

  console.log('[Agency] 로그인 시도:', { name })

  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role, username, password')
    .eq('username', name)
    .eq('password', password)
    .in('role', ['agency_staff', 'admin']) // 대리점 직원 또는 관리자만
    .single()

  if (error || !user) {
    throw new Error('이름 또는 비밀번호가 올바르지 않습니다')
  }

  // 대리점용 쿠키 설정
  const cookieStore = await cookies()
  cookieStore.set('agency_session', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  return {
    id: user.id,
    name: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
  }
}

/**
 * 레거시 호환용 (기존 코드 유지)
 */
export async function signIn(name: string, password: string): Promise<UserData> {
  const supabase = await createServiceRoleClient()

  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role, username, password')
    .eq('username', name)
    .eq('password', password)
    .single()

  if (error || !user) {
    throw new Error('이름 또는 비밀번호가 올바르지 않습니다')
  }

  // role에 따라 적절한 쿠키 설정
  const cookieStore = await cookies()
  const cookieName = user.role === 'customer' ? 'customer_session' : 'agency_session'

  cookieStore.set(cookieName, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  return {
    id: user.id,
    name: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
  }
}

/**
 * 고객 로그아웃
 */
export async function signOutCustomer(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('customer_session')
}

/**
 * 대리점/관리자 로그아웃
 */
export async function signOutAgency(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('agency_session')
}

/**
 * 로그아웃 (모든 세션 삭제)
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('customer_session')
  cookieStore.delete('agency_session')
  cookieStore.delete('user_id') // 레거시 쿠키도 삭제
}

/**
 * 고객 세션 확인
 */
export async function getCurrentCustomer(): Promise<UserData | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('customer_session')?.value

  if (!userId) {
    return null
  }

  const supabase = await createServiceRoleClient()
  const { data: user } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role')
    .eq('id', userId)
    .eq('role', 'customer')
    .single()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
  }
}

/**
 * 대리점/관리자 세션 확인
 */
export async function getCurrentAgency(): Promise<UserData | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('agency_session')?.value

  if (!userId) {
    return null
  }

  const supabase = await createServiceRoleClient()
  const { data: user } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role')
    .eq('id', userId)
    .in('role', ['agency_staff', 'admin'])
    .single()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
  }
}

/**
 * 현재 사용자 확인 (양쪽 세션 모두 체크)
 */
export async function getCurrentUser(): Promise<UserData | null> {
  // 고객 세션 먼저 확인
  const customer = await getCurrentCustomer()
  if (customer) return customer

  // 대리점 세션 확인
  const agency = await getCurrentAgency()
  if (agency) return agency

  // 레거시 user_id 쿠키 확인
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) {
    return null
  }

  const supabase = await createServiceRoleClient()
  const { data: user } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role')
    .eq('id', userId)
    .single()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
  }
}
