import { NextRequest, NextResponse } from 'next/server'
import { getPartialPaymentSales } from '@/lib/sales-server'

export async function GET() {
  try {
    const partialPayments = await getPartialPaymentSales()
    return NextResponse.json(partialPayments)
  } catch (error) {
    console.error('Get partial payments error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
