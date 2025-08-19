// Server-only expenses functions
import { getDatabase } from './mongodb-server'
import { ObjectId } from 'mongodb'

export interface Expense {
  _id?: string
  description: string
  amount: number
  category: string
  date: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export async function createExpense(expenseData: Omit<Expense, '_id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
  const db = await getDatabase()
  const expenses = db.collection<Expense>('expenses')
  
  const expense: Omit<Expense, '_id'> = {
    ...expenseData,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await expenses.insertOne(expense)
  return { ...expense, _id: result.insertedId.toString() }
}

export async function getExpenses(): Promise<Expense[]> {
  const db = await getDatabase()
  const expenses = db.collection<Expense>('expenses')
  
  const result = await expenses.find({}).sort({ date: -1 }).toArray()
  return result.map(expense => ({
    ...expense,
    _id: expense._id.toString()
  }))
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  const db = await getDatabase()
  const expenses = db.collection<Expense>('expenses')
  
  const result = await expenses.findOneAndUpdate(
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

export async function deleteExpense(id: string): Promise<boolean> {
  const db = await getDatabase()
  const expenses = db.collection<Expense>('expenses')
  
  const result = await expenses.deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
} 