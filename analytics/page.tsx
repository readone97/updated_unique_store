"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { Product } from "@/lib/products"
import { Sale } from "@/lib/sales"

export default function AnalyticsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{avgOrderValue.toFixed(2)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-blue-600">Average per transaction</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">Unique customers</span>
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
          </div>
      </main>
    </div>
  )
}
