"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, ShoppingCart, Calendar, DollarSign, TrendingUp, Minus } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { Sale } from "@/lib/sales"
import { Product } from "@/lib/products"
import { toast } from "sonner"

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'user' | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ id: string; name: string; price: number; quantity: number }>
  >([])
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [halfPaymentAmount, setHalfPaymentAmount] = useState("")

  useEffect(() => {
    fetchData()
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
      const [salesRes, productsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/products')
      ])

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setSales(salesData)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToSale = (product: Product) => {
    const existing = selectedProducts.find((p) => p.id === product._id)
    if (existing) {
      setSelectedProducts(selectedProducts.map((p) => (p.id === product._id ? { ...p, quantity: p.quantity + 1 } : p)))
    } else {
      setSelectedProducts([...selectedProducts, { 
        id: product._id!, 
        name: product.name, 
        price: product.price, 
        quantity: 1 
      }])
    }
  }

  const removeFromSale = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromSale(productId)
    } else {
      setSelectedProducts(selectedProducts.map((p) => (p.id === productId ? { ...p, quantity } : p)))
    }
  }

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0)
  }

  const completeSale = async () => {
    if (selectedProducts.length === 0) {
      toast.warning("Please add items to the sale")
      return
    }

    if (!paymentMethod) {
      toast.warning("Please select a payment method")
      return
    }

    if (paymentMethod === "Half Payment" && (!halfPaymentAmount || parseFloat(halfPaymentAmount) <= 0)) {
      toast.warning("Please enter a valid payment amount")
      return
    }

    try {
      const saleData = {
        customerName: customerName || "Walk-in Customer",
        items: selectedProducts.map(p => ({
          productId: p.id,
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          total: p.price * p.quantity
        })),
        paymentMethod,
        ...(paymentMethod === "Half Payment" && { amountPaid: parseFloat(halfPaymentAmount) })
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })

      if (response.ok) {
        toast.success("Sale completed successfully!")
        setSelectedProducts([])
        setCustomerName("")
        setPaymentMethod("")
        setHalfPaymentAmount("")
        setIsQuickSaleOpen(false)
        fetchData() // Refresh data
      } else {
        toast.error("Failed to complete sale")
      }
    } catch (error) {
      console.error('Error completing sale:', error)
      toast.error("An error occurred while completing the sale")
    }
  }

  const filteredSales = sales.filter(
    (sale) =>
      sale.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const todaySales = sales
    .filter(sale => new Date(sale.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, sale) => sum + sale.total, 0)

  const avgSale = sales.length > 0 
    ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length 
    : 0

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading sales...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
              <p className="text-gray-600">Record and manage your store transactions</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isQuickSaleOpen} onOpenChange={setIsQuickSaleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Sale
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Quick Sale</DialogTitle>
                    <DialogDescription>Select products to create a new sale transaction.</DialogDescription>
                  </DialogHeader>

                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">Customer Name (Optional)</label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Payment Method *</label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Debit Card">Debit Card</SelectItem>
                          <SelectItem value="Half Payment">Half Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {paymentMethod === "Half Payment" && (
                    <div className="mb-4">
                      <label className="text-sm font-medium">Amount Paid *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={halfPaymentAmount}
                        onChange={(e) => setHalfPaymentAmount(e.target.value)}
                        placeholder="Enter amount paid"
                        className="mt-1"
                        max={calculateTotal()}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Total amount: ₦{calculateTotal().toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Product Selection */}
                    <div>
                      <h4 className="font-medium mb-3">Available Products</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {products.map((product) => (
                          <div key={product._id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-gray-500">
                                ₦{product.price} • {product.stock} in stock
                              </p>
                            </div>
                            <Button size="sm" onClick={() => addToSale(product)} disabled={product.stock === 0}>
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cart */}
                    <div>
                      <h4 className="font-medium mb-3">Sale Items</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedProducts.length === 0 ? (
                          <p className="text-gray-500 text-sm">No items selected</p>
                        ) : (
                          selectedProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-gray-500">₦{product.price} each</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(product.id, product.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">{product.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(product.id, product.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => removeFromSale(product.id)}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {selectedProducts.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total:</span>
                            <span className="text-xl font-bold">₦{calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsQuickSaleOpen(false)
                      setSelectedProducts([])
                      setCustomerName("")
                      setPaymentMethod("")
                      setHalfPaymentAmount("")
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={completeSale} disabled={selectedProducts.length === 0}>
                      Complete Sale
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{todaySales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">Today's revenue</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sales.length}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{sales.filter((s) => s.status === "Completed").length}</span>{" "}
                  completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Sale</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{avgSale.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">Average transaction</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">All time revenue</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales History</CardTitle>
                  <CardDescription>Recent transactions and sales records</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search sales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium">{sale.invoiceId}</TableCell>
                      <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {sale.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₦{sale.total.toFixed(2)}</TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === "Completed" ? "default" : "secondary"}>{sale.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
