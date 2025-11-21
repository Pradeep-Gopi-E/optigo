export interface User {
  id: string
  email: string
  name: string
  telegram_id?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  name: string
  password: string
  location?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface UserProfileUpdate {
  name?: string
  telegram_id?: string
  location?: string
}