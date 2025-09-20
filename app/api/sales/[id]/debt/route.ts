import { NextRequest, NextResponse } from 'next/server'
import { updateSale } from '@/lib/sales-server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/mongodb-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { additionalDebt } = await request.json()
    
    if (!additionalDebt || additionalDebt <= 0) {
      return NextResponse.json(
        { message: 'Invalid debt amount' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const sales = db.collection('sales')
    
    const sale = await sales.findOne({ _id: new ObjectId(params.id) })
    if (!sale) {
      return NextResponse.json(
        { message: 'Sale not found' },
        { status: 404 }
      )
    }

    const newRemainingBalance = (sale.remainingBalance || 0) + additionalDebt
    const newTotal = sale.total + additionalDebt

    const updatedSale = await updateSale(params.id, {
      total: newTotal,
      remainingBalance: newRemainingBalance,
      status: 'Partial Payment'
    })

    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error('Add debt error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
