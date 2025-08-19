import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDatabase } from './mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface User {
  _id?: string
  email: string
  password: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt'>): Promise<User> {
  const db = await getDatabase()
  const users = db.collection<User>('users')
  
  // Check if user already exists
  const existingUser = await users.findOne({ email: userData.email })
  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = await hashPassword(userData.password)
  const user: Omit<User, '_id'> = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date()
  }

  const result = await users.insertOne(user)
  return { ...user, _id: result.insertedId.toString() }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const db = await getDatabase()
  const users = db.collection<User>('users')
  
  const user = await users.findOne({ email })
  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return null
  }

  return user
}
