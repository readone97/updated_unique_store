import { NextRequest, NextResponse } from 'next/server'
import { updateSale } from '@/lib/sales-server'
import { updateProduct, getProducts } from '@/lib/products-server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/mongodb-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { additionalPayment, newItems } = await request.json()
    
    console.log('=== CONSOLIDATE API START ===')
    console.log('Sale ID:', params.id)
    console.log('Additional Payment:', additionalPayment)
    console.log('New Items:', JSON.stringify(newItems, null, 2))
    
    // Validate input
    if (additionalPayment === undefined || additionalPayment < 0) {
      console.log('❌ Invalid payment amount')
      return NextResponse.json(
        { message: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    if (!newItems || !Array.isArray(newItems) || newItems.length === 0) {
      console.log('❌ No items provided')
      return NextResponse.json(
        { message: 'No items provided' },
        { status: 400 }
      )
    }

    // Get database connection
    const db = await getDatabase()
    const sales = db.collection('sales')
    
    // Find the existing sale
    const sale = await sales.findOne({ _id: new ObjectId(params.id) })
    if (!sale) {
      console.log('❌ Sale not found:', params.id)
      return NextResponse.json(
        { message: 'Sale not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found existing sale:', {
      id: sale._id.toString(),
      customerName: sale.customerName,
      currentTotal: sale.total,
      currentAmountPaid: sale.amountPaid,
      currentRemainingBalance: sale.remainingBalance,
      currentStatus: sale.status,
      currentItemsCount: sale.items?.length || 0
    })

    // Calculate new totals
    const newItemsTotal = newItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const newTotal = sale.total + newItemsTotal
    const newAmountPaid = (sale.amountPaid || 0) + additionalPayment
    const newRemainingBalance = newTotal - newAmountPaid
    const newStatus = newRemainingBalance <= 0 ? 'Completed' : 'Partial Payment'

    console.log('📊 Calculated new totals:', {
      newItemsTotal,
      newTotal,
      newAmountPaid,
      newRemainingBalance,
      newStatus
    })

    // Merge items - combine quantities for same products
    const existingItems = sale.items || []
    const mergedItems = [...existingItems]

    newItems.forEach((newItem: any) => {
      const existingItemIndex = mergedItems.findIndex(
        (item: any) => item.productId === newItem.productId
      )
      
      if (existingItemIndex >= 0) {
        // Update existing item
        mergedItems[existingItemIndex].quantity += newItem.quantity
        mergedItems[existingItemIndex].total += newItem.total
        console.log(`🔄 Updated existing item: ${newItem.name} (qty: ${mergedItems[existingItemIndex].quantity})`)
      } else {
        // Add new item
        mergedItems.push(newItem)
        console.log(`➕ Added new item: ${newItem.name} (qty: ${newItem.quantity})`)
      }
    })

    console.log('📝 Final merged items count:', mergedItems.length)

    // Update the sale record
    const updateData = {
      items: mergedItems,
      total: newTotal,
      amountPaid: newAmountPaid,
      remainingBalance: Math.max(0, newRemainingBalance),
      status: newStatus,
      updatedAt: new Date()
    }

    console.log('💾 Updating sale with:', updateData)

    const updatedSale = await updateSale(params.id, updateData)

    if (!updatedSale) {
      console.log('❌ Failed to update sale')
      return NextResponse.json(
        { message: 'Failed to update sale' },
        { status: 500 }
      )
    }

    console.log('✅ Sale updated successfully:', {
      id: updatedSale._id,
      newTotal: updatedSale.total,
      newAmountPaid: updatedSale.amountPaid,
      newRemainingBalance: updatedSale.remainingBalance,
      newStatus: updatedSale.status,
      itemsCount: updatedSale.items?.length || 0
    })

    // Update product stock for new items
    console.log('📦 Updating product stock...')
    const products = await getProducts()
    for (const item of newItems) {
      const product = products.find(p => p._id === item.productId)
      if (product) {
        const newStock = product.stock - item.quantity
        await updateProduct(item.productId, { stock: newStock })
        console.log(`📦 Updated stock for ${item.name}: ${product.stock} -> ${newStock}`)
      } else {
        console.log(`⚠️ Product not found for stock update: ${item.productId}`)
      }
    }

    console.log('=== CONSOLIDATE API SUCCESS ===')
    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error('❌ Consolidate sale error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}