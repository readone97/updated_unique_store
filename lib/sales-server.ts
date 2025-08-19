// Server-only sales functions
import { getDatabase } from './mongodb-server'
import { ObjectId } from 'mongodb'

export interface SaleItem {
  productId: string
  name: string
  quantity: number
  price: number
  total: number
}

export interface Sale {
  _id?: string
  invoiceId: string
  customerId?: string
  customerName: string
  customerPhone?: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  amountPaid?: number
  remainingBalance?: number
  status: 'Completed' | 'Pending' | 'Cancelled' | 'Partial Payment'
  createdAt: Date
  updatedAt: Date
}

export async function createSale(saleData: Omit<Sale, '_id' | 'createdAt' | 'updatedAt'>): Promise<Sale> {
  const db = await getDatabase()
  const sales = db.collection<Sale>('sales')
  
  const sale: Omit<Sale, '_id'> = {
    ...saleData,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await sales.insertOne(sale)
  return { ...sale, _id: result.insertedId.toString() }
}

export async function getSales(): Promise<Sale[]> {
  const db = await getDatabase()
  const sales = db.collection<Sale>('sales')
  
  const result = await sales.find({}).sort({ createdAt: -1 }).toArray()
  return result.map(sale => ({
    ...sale,
    _id: sale._id.toString()
  }))
}

export async function getPartialPaymentSales(): Promise<Sale[]> {
  const db = await getDatabase()
  const sales = db.collection<Sale>('sales')
  
  const result = await sales.find({ 
    status: 'Partial Payment',
    remainingBalance: { $gt: 0 }
  }).sort({ createdAt: -1 }).toArray()
  
  return result.map(sale => ({
    ...sale,
    _id: sale._id.toString()
  }))
}

export async function updateSale(id: string, updates: Partial<Sale>): Promise<Sale | null> {
  const db = await getDatabase()
  const sales = db.collection<Sale>('sales')
  
  const result = await sales.findOneAndUpdate(
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

export async function generateInvoiceId(): Promise<string> {
  const db = await getDatabase()
  const sales = db.collection<Sale>('sales')
  
  const count = await sales.countDocuments()
  return `INV-${String(count + 1).padStart(4, '0')}`
}
