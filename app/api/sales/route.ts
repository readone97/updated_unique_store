import { NextRequest, NextResponse } from 'next/server'
import { getSales, createSale, generateInvoiceId } from '@/lib/sales-server'
import { updateProduct, getProducts } from '@/lib/products-server'

export async function GET() {
  try {
    const sales = await getSales()
    return NextResponse.json(sales)
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const saleData = await request.json()
    
    const invoiceId = await generateInvoiceId()
    
    const total = saleData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const subtotal = total
    const tax = 0

    let status = 'Completed'
    let amountPaid = total
    let remainingBalance = 0

    if (saleData.paymentMethod === 'Half Payment') {
      const paidAmount = parseFloat(saleData.amountPaid || 0)
      if (paidAmount < total) {
        status = 'Partial Payment'
        amountPaid = paidAmount
        remainingBalance = total - paidAmount
      }
    }

    const sale = await createSale({
      ...saleData,
      invoiceId,
      subtotal,
      tax,
      total,
      amountPaid,
      remainingBalance,
      status
    })

    const products = await getProducts()
    for (const item of saleData.items) {
      const product = products.find(p => p._id === item.productId)
      if (product) {
        const newStock = product.stock - item.quantity
        await updateProduct(item.productId, { stock: newStock })
      }
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Create sale error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
