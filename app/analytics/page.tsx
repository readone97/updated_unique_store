"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar, Plus, Edit, Trash2, Receipt } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { Product } from "@/lib/products"
import { Sale } from "@/lib/sales"
import { Expense } from "@/lib/expenses"
import { toast } from "sonner"

export default function AnalyticsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'user' | null>(null)
  
  // Expense form state
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  useEffect(() => {
    fetchData()
    // Decode role from cookie
    try {
      const match = document.cookie.match(/(?:^|; )auth-token=([^;]+)/)
      if (match) {
        const token = decodeURIComponent(match[1])
        const payload = JSON.parse(atob(token.split('.')[1]))
        setRole((payload.role as 'admin' | 'user') || 'user')
      } else {
        setRole('user')
      }
    } catch {
      setRole('user')
    }
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, salesRes, expensesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales'),
        fetch('/api/expenses')
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setSales(salesData)
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category || !newExpense.date) {
      toast.warning("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExpense),
      })

      if (response.ok) {
        const expense = await response.json()
        setExpenses([expense, ...expenses])
        setNewExpense({
          description: "",
          amount: "",
          category: "",
          date: new Date().toISOString().split('T')[0],
          notes: ""
        })
        setIsAddExpenseDialogOpen(false)
        toast.success("Expense added successfully!")
      } else {
        toast.error("Failed to add expense")
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error("An error occurred while adding the expense")
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense({ ...expense })
    setIsEditExpenseDialogOpen(true)
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return

    if (!editingExpense.description || !editingExpense.amount || !editingExpense.category || !editingExpense.date) {
      toast.warning("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch(`/api/expenses/${editingExpense._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingExpense),
      })

      if (response.ok) {
        const updatedExpense = await response.json()
        setExpenses(expenses.map((expense) => 
          expense._id === editingExpense._id ? updatedExpense : expense
        ))
        setIsEditExpenseDialogOpen(false)
        setEditingExpense(null)
        toast.success("Expense updated successfully!")
      } else {
        toast.error("Failed to update expense")
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      toast.error("An error occurred while updating the expense")
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExpenses(expenses.filter((expense) => expense._id !== expenseId))
        toast.success("Expense deleted successfully!")
      } else {
        toast.error("Failed to delete expense")
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error("An error occurred while deleting the expense")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </main>
      </div>
    )
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const netProfit = totalRevenue - totalExpenses
  const totalUnits = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0
  const totalCustomers = new Set(sales.map(sale => sale.customerName)).size

  const lowStockItems = products.filter(p => p.stock <= p.minStock)

  // Get top products by revenue
  const productSales = new Map<string, { name: string; revenue: number; units: number }>()
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const existing = productSales.get(item.name) || { name: item.name, revenue: 0, units: 0 }
      existing.revenue += item.total
      existing.units += item.quantity
      productSales.set(item.name, existing)
    })
  })

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Category performance
  const categoryPerformance = new Map<string, { revenue: number; percentage: number }>()
  
  products.forEach(product => {
    const productRevenue = sales.reduce((sum, sale) => {
      const item = sale.items.find(item => item.name === product.name)
      return sum + (item ? item.total : 0)
    }, 0)
    
    const existing = categoryPerformance.get(product.category) || { revenue: 0, percentage: 0 }
    existing.revenue += productRevenue
    categoryPerformance.set(product.category, existing)
  })

  // Calculate percentages
  categoryPerformance.forEach((value, key) => {
    value.percentage = totalRevenue > 0 ? (value.revenue / totalRevenue) * 100 : 0
  })

  const categoryData = Array.from(categoryPerformance.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Expense categories for the form
  const expenseCategories = [
    "Rent & Utilities",
    "Salaries & Wages",
    "Inventory & Supplies",
    "Marketing & Advertising",
    "Equipment & Maintenance",
    "Insurance & Legal",
    "Transportation",
    "Miscellaneous"
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">Track your store's performance and insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select defaultValue="30days">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Custom Range
              </Button>
              {role === 'admin' && (
                <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Expense</DialogTitle>
                      <DialogDescription>Enter the details for your new expense.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description *
                        </Label>
                        <Input
                          id="description"
                          className="col-span-3"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                          placeholder="Expense description"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          Amount *
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          className="col-span-3"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          Category *
                        </Label>
                        <Select
                          value={newExpense.category}
                          onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                          Date *
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          className="col-span-3"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                          Notes
                        </Label>
                        <Textarea
                          id="notes"
                          className="col-span-3"
                          value={newExpense.notes}
                          onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                          placeholder="Additional notes (optional)"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddExpense}>
                        Add Expense
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{totalRevenue.toFixed(2)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">All time revenue</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₦{totalExpenses.toFixed(2)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-red-600">Total expenses</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₦{netProfit.toFixed(2)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {netProfit >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-green-600">Net profit</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                      <span className="text-red-600">Net loss</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUnits}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">Total units sold</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.units} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₦{product.revenue.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  {topProducts.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No sales data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Revenue breakdown by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-20 text-sm font-medium">{category.category}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${Math.min(category.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">₦{category.revenue.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                  {categoryData.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No category data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Track your business expenses and their impact on profitability</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    {role === 'admin' && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.slice(0, 10).map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        ₦{expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {expense.notes || "-"}
                      </TableCell>
                      {role === 'admin' && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteExpense(expense._id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={role === 'admin' ? 6 : 5} className="text-center text-gray-500 py-4">
                        No expenses recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Products that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-orange-600">{item.stock} left</div>
                      <div className="text-sm text-gray-500">Min: {item.minStock}</div>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && (
                  <p className="text-center text-gray-500 py-4">All products are well stocked!</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Expense Dialog */}
          <Dialog open={isEditExpenseDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setIsEditExpenseDialogOpen(false)
              setEditingExpense(null)
            }
          }}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Expense</DialogTitle>
                <DialogDescription>Update the expense details.</DialogDescription>
              </DialogHeader>
              {editingExpense && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-description" className="text-right">
                      Description *
                    </Label>
                    <Input
                      id="edit-description"
                      className="col-span-3"
                      value={editingExpense.description}
                      onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                      placeholder="Expense description"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-amount" className="text-right">
                      Amount *
                    </Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      className="col-span-3"
                      value={editingExpense.amount.toString()}
                      onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-category" className="text-right">
                      Category *
                    </Label>
                    <Select
                      value={editingExpense.category}
                      onValueChange={(value) => setEditingExpense({ ...editingExpense, category: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-date" className="text-right">
                      Date *
                    </Label>
                    <Input
                      id="edit-date"
                      type="date"
                      className="col-span-3"
                      value={new Date(editingExpense.date).toISOString().split('T')[0]}
                      onChange={(e) => setEditingExpense({ ...editingExpense, date: new Date(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-notes" className="text-right">
                      Notes
                    </Label>
                    <Textarea
                      id="edit-notes"
                      className="col-span-3"
                      value={editingExpense.notes || ""}
                      onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditExpenseDialogOpen(false)
                  setEditingExpense(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateExpense}>
                  Update Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
