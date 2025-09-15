import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface User {
  id: string
  phone: string
  name?: string
  email?: string
  consent: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      phone: user.phone,
      name: user.name,
      email: user.email,
      consent: user.consent
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User
    return decoded
  } catch (error) {
    return null
  }
}

export async function createUser(phone: string, password: string, name?: string, email?: string) {
  const hashedPassword = await hashPassword(password)
  
  return prisma.user.create({
    data: {
      phone,
      password: hashedPassword,
      name,
      email,
      consent: false
    }
  })
}

export async function findUserByPhone(phone: string) {
  return prisma.user.findUnique({
    where: { phone }
  })
}

export async function updateUserConsent(userId: string, consent: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { consent }
  })
}
