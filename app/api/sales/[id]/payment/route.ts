import { NextRequest, NextResponse } from 'next/server'
import { updateSale } from '@/lib/sales-server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/mongodb-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { additionalPayment } = await request.json()
    
    if (!additionalPayment || additionalPayment <= 0) {
      return NextResponse.json(
        { message: 'Invalid payment amount' },
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

    const newAmountPaid = (sale.amountPaid || 0) + additionalPayment
    const newRemainingBalance = sale.total - newAmountPaid
    const newStatus = newRemainingBalance <= 0 ? 'Completed' : 'Partial Payment'

    const updatedSale = await updateSale(params.id, {
      amountPaid: newAmountPaid,
      remainingBalance: Math.max(0, newRemainingBalance),
      status: newStatus
    })

    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
