import { NextRequest, NextResponse } from 'next/server'
import { getExpenses, createExpense } from '@/lib/expenses-server'
import { verifyToken } from '@/lib/auth-server'

export async function GET() {
  try {
    const expenses = await getExpenses()
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Enforce admin role
    const token = request.cookies.get('auth-token')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const expenseData = await request.json()
    
    // Validate required fields
    if (!expenseData.description || !expenseData.amount || !expenseData.category || !expenseData.date) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse the date
    const expense = await createExpense({
      ...expenseData,
      date: new Date(expenseData.date),
      amount: parseFloat(expenseData.amount)
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 