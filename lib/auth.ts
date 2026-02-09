import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { connectToDatabase } from './mongodb'
import User, { IUser, UserRole } from './models/user'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

const COOKIE_NAME = 'news-auth-token'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  name: string
  [key: string]: any // Index signature for jose compatibility
}

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Compare password with hash
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

// Remove auth cookie
export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Get current user from cookie
export async function getCurrentUser(): Promise<IUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return null
    }

    await connectToDatabase()
    const user = await User.findById(payload.userId)
    return user
  } catch {
    return null
  }
}

// Get current user payload (lighter, no DB query)
export async function getCurrentUserPayload(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    return verifyToken(token)
  } catch {
    return null
  }
}

// Check if user has required role
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

// Role hierarchy check
export function canAccessRole(userRole: UserRole, targetRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    admin: 4,
    editor: 3,
    author: 2,
    reader: 1,
  }
  return hierarchy[userRole] >= hierarchy[targetRole]
}

// Verify authentication and return user payload
export async function verifyAuth(): Promise<{
  isAuthenticated: boolean
  user: JWTPayload | null
}> {
  try {
    const payload = await getCurrentUserPayload()
    if (!payload) {
      return { isAuthenticated: false, user: null }
    }
    return { isAuthenticated: true, user: payload }
  } catch {
    return { isAuthenticated: false, user: null }
  }
}
