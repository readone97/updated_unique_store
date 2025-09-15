import { NextRequest, NextResponse } from 'next/server'
import { getProducts, createProduct } from '@/lib/products-server'
import { verifyToken } from '@/lib/auth-server'

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products error:', error)
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

    const productData = await request.json()
    
    const status = productData.stock === 0 
      ? 'Out of Stock' 
      : productData.stock < 10
        ? 'Low Stock'
        : 'In Stock'

    const product = await createProduct({
      ...productData,
      status,
      image: productData.image || `/placeholder.svg?height=40&width=40&text=${productData.name.split(' ')[0]}`
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
