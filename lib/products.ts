import { getDatabase } from './mongodb'
import { ObjectId } from 'mongodb'

export interface Product {
  _id?: string
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
  supplier: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export async function createProduct(productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const db = await getDatabase()
  const products = db.collection<Product>('products')
  
  const product: Omit<Product, '_id'> = {
    ...productData,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await products.insertOne(product)
  return { ...product, _id: result.insertedId.toString() }
}

export async function getProducts(): Promise<Product[]> {
  const db = await getDatabase()
  const products = db.collection<Product>('products')
  
  const result = await products.find({}).toArray()
  return result.map(product => ({
    ...product,
    _id: product._id.toString()
  }))
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const db = await getDatabase()
  const products = db.collection<Product>('products')
  
  const result = await products.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: 'after' }
  )

  if (!result) return null
  
  return {
    ...result,
    _id: result._id.toString()
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = await getDatabase()
  const products = db.collection<Product>('products')
  
  const result = await products.deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}
