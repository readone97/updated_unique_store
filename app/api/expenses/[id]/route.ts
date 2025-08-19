import { NextRequest, NextResponse } from 'next/server'
import { updateExpense, deleteExpense } from '@/lib/expenses-server'
import { verifyToken } from '@/lib/auth-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Enforce admin role
    const token = request.cookies.get('auth-token')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const updates = await request.json()
    
    // Validate required fields
    if (!updates.description || !updates.amount || !updates.category || !updates.date) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const expense = await updateExpense(params.id, {
      ...updates,
      date: new Date(updates.date),
      amount: parseFloat(updates.amount)
    })

    if (!expense) {
      return NextResponse.json(
        { message: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Update expense error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Enforce admin role
    const token = request.cookies.get('auth-token')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const success = await deleteExpense(params.id)

    if (!success) {
      return NextResponse.json(
        { message: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 