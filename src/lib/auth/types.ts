// Authentication types and interfaces

import { User } from '@supabase/supabase-js'

export type UserRole =
  | 'admin'
  | 'super-admin'
  | 'super_admin'
  | 'shop_admin'
  | 'organization_admin'
  | 'demo'
  | 'user'

export interface AuthUser extends User {
  user_metadata?: {
    shop_id?: string
    [key: string]: any
  }
}

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  shop_id?: string
  organization_id?: string
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at?: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  confirmPassword?: string
  metadata?: Record<string, any>
}

export interface AuthResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface AuthError {
  message: string
  code?: string
  status?: number
}
