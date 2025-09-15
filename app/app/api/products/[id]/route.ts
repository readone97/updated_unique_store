import { NextRequest, NextResponse } from 'next/server'
import { updateProduct, deleteProduct } from '@/lib/products-server'
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
    
    if (updates.stock !== undefined) {
      updates.status = updates.stock === 0 
        ? 'Out of Stock' 
        : updates.stock < 10
          ? 'Low Stock'
          : 'In Stock'
    }

    const product = await updateProduct(params.id, updates)
    
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Update product error:', error)
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

    const success = await deleteProduct(params.id)
    
    if (!success) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
