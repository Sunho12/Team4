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
 * Simple login - check name (username) and password
 */
export async function signIn(name: string, password: string): Promise<UserData> {
  const supabase = await createServiceRoleClient()

  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, role, username, password')
    .eq('username', name) // Username is name
    .eq('password', password) // Check password
    .single()

  if (error || !user) {
    throw new Error('이름 또는 비밀번호가 올바르지 않습니다')
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('user_id', user.id, {
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
 * Sign out - clear cookie
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('user_id')
}

/**
 * Get current user from cookie
 */
export async function getCurrentUser(): Promise<UserData | null> {
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
