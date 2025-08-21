import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    const user = await createUser({
      name,
      email,
      password,
      role: role || 'user'
    })

    const token = generateToken(user._id!.toString(), user.role)

    return NextResponse.json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id!.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    
    if (error.message === 'User already exists') {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
