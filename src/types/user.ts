export interface User {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  email: string
  name: string | null
}

export interface SignUpData {
  email: string
  password: string
  name: string
}

export interface SignInData {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  followCount: number
  notificationCount: number
}