"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, Package, TrendingUp, AlertTriangle, Search, Plus, ShoppingCart } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Product } from "@/lib/products"
import { Sale } from "@/lib/sales"
import { toast } from "sonner"

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'user' | null>(null)

  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ id: string; name: string; price: number; quantity: number; stock: number }>
  >([])
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
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
      const [productsRes, salesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales')
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setSales(salesData)
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
      if (existing.quantity < product.stock) {
        setSelectedProducts(selectedProducts.map((p) => (p.id === product._id ? { ...p, quantity: p.quantity + 1 } : p)))
      } else {
        toast.warning(`Only ${product.stock} items available in stock`)
      }
    } else {
      setSelectedProducts([...selectedProducts, { 
        id: product._id!, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        stock: product.stock 
      }])
    }
  }

  const removeFromSale = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p._id === productId)
    if (!product) return

    if (quantity <= 0) {
      removeFromSale(productId)
    } else if (quantity <= product.stock) {
      setSelectedProducts(selectedProducts.map((p) => (p.id === productId ? { ...p, quantity } : p)))
    } else {
      toast.warning(`Only ₦{product.stock} items available in stock`)
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const lowStockItems = products.filter(p => p.stock <= p.minStock)
  const recentSales = sales.slice(0, 5)

  const dashboardStats = {
    totalProducts: products.length,
    totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
    lowStock: lowStockItems.length,
    todaySales: sales
      .filter(sale => new Date(sale.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, sale) => sum + sale.total, 0)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening in your store.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => setIsQuickSaleOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Quick Sale
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">Active inventory</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{dashboardStats.totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">All time revenue</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{dashboardStats.lowStock}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{dashboardStats.todaySales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">Today's revenue</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Sales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Latest transactions in your store</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale._id}>
                        <TableCell className="font-medium">{sale.invoiceId}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.items.length} items</TableCell>
                        <TableCell>₦{sale.total.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>Items that need restocking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        {item.stock} left
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Min: {item.minStock}</p>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && (
                  <p className="text-center text-gray-500 py-4">All products are well stocked!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Sale Dialog */}
        <Dialog open={isQuickSaleOpen} onOpenChange={setIsQuickSaleOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
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
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 h-9 px-3 border rounded w-full"
                >
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Half Payment">Half Payment</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>

            {/* Half Payment Amount Input */}
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
                  max={calculateTotal() * 1.08}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total amount: ₦{(calculateTotal() * 1.08).toFixed(2)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 py-4">
              {/* Product Selection */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Available Products ({filteredProducts.length})</h4>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-48 h-8"
                    />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="h-8 px-2 border rounded text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="Detergents">Detergents</option>
                      <option value="Provisions">Provisions</option>
                      <option value="Others">Others</option>
                    
                    
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto border rounded p-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">₦{product.price}</p>
                          <p className={`text-xs ${product.stock <= 10 ? "text-orange-600" : "text-green-600"}`}>
                            {product.stock} in stock
                          </p>
                        </div>
                        <p className="text-xs text-blue-600">{product.category}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToSale(product)}
                        disabled={product.stock === 0}
                        className="ml-2"
                      >
                        {product.stock === 0 ? "Out" : "Add"}
                      </Button>
                    </div>
                  ))}

                  {filteredProducts.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      No products found matching your search criteria
                    </div>
                  )}
                </div>
              </div>

              {/* Cart */}
              <div className="border-l pl-4">
                <h4 className="font-medium mb-3">Sale Items ({selectedProducts.length})</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No items selected
                    </div>
                  ) : (
                    selectedProducts.map((product) => (
                      <div key={product.id} className="p-2 bg-gray-50 rounded border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500">₦{product.price} each</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromSale(product.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(product.id, product.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{product.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(product.id, product.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              +
                            </Button>
                          </div>
                          <span className="text-sm font-medium">₦{(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border">
                    <div className="space-y-2">
                      {/* <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>₦{calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (8%):</span>
                        <span>₦{(calculateTotal() * 0.08).toFixed(2)}</span>
                      </div> */}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total:</span>
                        <span>₦{(calculateTotal() * 1.08).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedProducts.length} items • ₦{(calculateTotal() * 1.08).toFixed(2)} total
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsQuickSaleOpen(false)
                      setSelectedProducts([])
                      setProductSearchTerm("")
                      setSelectedCategory("all")
                      setCustomerName("")
                      setPaymentMethod("")
                      setHalfPaymentAmount("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={completeSale}
                    disabled={selectedProducts.length === 0 || !paymentMethod}
                  >
                    Complete Sale
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
