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
import { Search, Plus, Edit, Trash2, Filter, Download, Upload } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import Image from "next/image"
import { Product } from "@/lib/products"
import { toast } from "sonner"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'user' | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    minStock: "",
    supplier: "",
    description: "",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchProducts()
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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) {
      toast.warning("Please fill in all required fields")
      return
    }

    const stockValue = parseInt(newProduct.stock)
    if (stockValue < 0) {
      toast.warning("Stock cannot be negative")
      return
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          stock: Math.max(0, stockValue), // Ensure stock is never negative
          minStock: parseInt(newProduct.minStock) || 10,
          supplier: newProduct.supplier || "Unknown",
        }),
      })

      if (response.ok) {
        const product = await response.json()
        setProducts([...products, product])
        setNewProduct({
          name: "",
          category: "",
          price: "",
          stock: "",
          minStock: "",
          supplier: "",
          description: "",
        })
        setIsAddDialogOpen(false)
        toast.success("Product added successfully!")
      } else {
        toast.error("Failed to add product")
      }
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error("An error occurred while adding the product")
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProducts(products.filter((product) => product._id !== productId))
        toast.success("Product deleted successfully!")
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error("An error occurred while deleting the product")
    }
  }

  const handleEditProduct = (product: Product) => {
    // Create a copy of the product to avoid mutating the original
    setEditingProduct({ ...product })
    setIsEditDialogOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    if (!editingProduct.name || !editingProduct.category || !editingProduct.price || editingProduct.stock === undefined) {
      toast.warning("Please fill in all required fields")
      return
    }

    if (editingProduct.price <= 0) {
      toast.warning("Price must be greater than 0")
      return
    }

    if (editingProduct.stock < 0) {
      toast.warning("Stock cannot be negative")
      return
    }

    if (editingProduct.minStock < 0) {
      toast.warning("Minimum stock cannot be negative")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingProduct.name,
          category: editingProduct.category,
          price: editingProduct.price,
          stock: Math.max(0, editingProduct.stock), // Ensure stock is never negative
          minStock: editingProduct.minStock,
          supplier: editingProduct.supplier || "Unknown",
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(products.map((product) => 
          product._id === editingProduct._id ? updatedProduct : product
        ))
        setIsEditDialogOpen(false)
        setEditingProduct(null)
        toast.success("Product updated successfully!")
      } else {
        toast.error("Failed to update product")
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error("An error occurred while updating the product")
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Add helper function to handle stock input changes
  const handleStockChange = (value: string, isEdit: boolean = false) => {
    const numericValue = parseInt(value) || 0
    const clampedValue = Math.max(0, numericValue) // Ensure value is never negative
    
    if (isEdit && editingProduct) {
      setEditingProduct({ ...editingProduct, stock: clampedValue })
    } else {
      setNewProduct({ ...newProduct, stock: clampedValue.toString() })
    }
  }

  // Add helper function to calculate status based on stock
  const calculateStatus = (stock: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    if (stock === 0) return 'Out of Stock'
    if (stock < 10) return 'Low Stock'
    return 'In Stock'
  }

  // Update getStatusBadge to use calculated status
  const getStatusBadge = (product: Product) => {
    const status = calculateStatus(product.stock)
    if (status === "Out of Stock") {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (status === "Low Stock") {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Low Stock
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          In Stock
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600">Manage your inventory and product catalog</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {role === 'admin' && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>Enter the details for your new product.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        className="col-span-3"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Product name"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        Category *
                      </Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                     <SelectItem value="Casing">Casing</SelectItem>
                      <SelectItem value="Remote_xhorse">Remote Xhorse</SelectItem>
                      <SelectItem value="Remote_keyDiy">Remote KeyDiy</SelectItem>
                      <SelectItem value="Valet_Key">Valet Key</SelectItem>
                      <SelectItem value="Keyholder">Keyholder</SelectItem>
                      <SelectItem value="Jacket">Key Jacket</SelectItem>
                      <SelectItem value="Battery">Battery</SelectItem>
                       <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="After_Market">After Market</SelectItem>
                      <SelectItem value="Work">Labour</SelectItem>
                      <SelectItem value="Blade">Blade</SelectItem>
                      <SelectItem value="Emulator">Emulator</SelectItem>
                      <SelectItem value="Blade">Blade</SelectItem>
                      <SelectItem value="Pcb">PCB</SelectItem>
                      <SelectItem value="Chip">Transponder Chip</SelectItem>
                      <SelectItem value="Original">Original Key</SelectItem>
                      <SelectItem value="Keyless">Keyless</SelectItem>
                      <SelectItem value="OEM">OEM Key</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        className="col-span-3"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stock" className="text-right">
                        Stock *
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        className="col-span-3"
                        value={newProduct.stock}
                        onChange={(e) => handleStockChange(e.target.value, false)}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="minStock" className="text-right">
                        Min Stock
                      </Label>
                      <Input
                        id="minStock"
                        type="number"
                        className="col-span-3"
                        value={newProduct.minStock}
                        onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="supplier" className="text-right">
                        Supplier
                      </Label>
                      <Input
                        id="supplier"
                        className="col-span-3"
                        value={newProduct.supplier}
                        onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                        placeholder="Supplier name"
                      />
                    </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" onClick={handleAddProduct}>
                        Add Product
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setIsEditDialogOpen(false)
              setEditingProduct(null)
            }
          }}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>Update the product details.</DialogDescription>
              </DialogHeader>
              {editingProduct && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">
                      Name *
                    </Label>
                    <Input
                      id="edit-name"
                      className="col-span-3"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="Product name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-category" className="text-right">
                      Category *
                    </Label>
                    <Select
                      value={editingProduct.category}
                      onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                       <SelectItem value="Casing">Casing</SelectItem>
                      <SelectItem value="Remote_xhorse">Remote Xhorse</SelectItem>
                      <SelectItem value="Remote_keyDiy">Remote KeyDiy</SelectItem>
                      <SelectItem value="Valet_Key">Valet Key</SelectItem>
                      <SelectItem value="Keyholder">Keyholder</SelectItem>
                      <SelectItem value="Jacket">Key Jacket</SelectItem>
                      <SelectItem value="Battery">Battery</SelectItem>
                       <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="After_Market">After Market</SelectItem>
                      <SelectItem value="Work">Labour</SelectItem>
                      <SelectItem value="Blade">Blade</SelectItem>
                      <SelectItem value="Emulator">Emulator</SelectItem>
                      <SelectItem value="Blade">Blade</SelectItem>
                      <SelectItem value="Pcb">PCB</SelectItem>
                      <SelectItem value="Chip">Transponder Chip</SelectItem>
                      <SelectItem value="Original">Original Key</SelectItem>
                      <SelectItem value="Keyless">Keyless</SelectItem>
                      <SelectItem value="OEM">OEM Key</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-price" className="text-right">
                      Price *
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      className="col-span-3"
                      value={editingProduct.price.toString()}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-stock" className="text-right">
                      Stock *
                    </Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      min="0"
                      className="col-span-3"
                      value={editingProduct.stock.toString()}
                      onChange={(e) => handleStockChange(e.target.value, true)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-minStock" className="text-right">
                      Min Stock
                    </Label>
                    <Input
                      id="edit-minStock"
                      type="number"
                      className="col-span-3"
                      value={editingProduct.minStock.toString()}
                      onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 10 })}
                      placeholder="10"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-supplier" className="text-right">
                      Supplier
                    </Label>
                    <Input
                      id="edit-supplier"
                      className="col-span-3"
                      value={editingProduct.supplier}
                      onChange={(e) => setEditingProduct({ ...editingProduct, supplier: e.target.value })}
                      placeholder="Supplier name"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingProduct(null)
                }} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProduct} disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                       <SelectItem value="Casing">Casing</SelectItem>
                      <SelectItem value="Remote_xhorse">Remote Xhorse</SelectItem>
                      <SelectItem value="Remote_keyDiy">Remote KeyDiy</SelectItem>
                      <SelectItem value="Valet_Key">Valet Key</SelectItem>
                      <SelectItem value="Keyholder">Keyholder</SelectItem>
                      <SelectItem value="Jacket">Key Jacket</SelectItem>
                      <SelectItem value="Battery">Battery</SelectItem>
                       <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="After_Market">After Market</SelectItem>
                      <SelectItem value="Work">Labour</SelectItem>
                      <SelectItem value="Blade">Blade</SelectItem>
                      <SelectItem value="Emulator">Emulator</SelectItem>
                      <SelectItem value="Blade">Blade</SelectItem>
                      <SelectItem value="Pcb">PCB</SelectItem>
                      <SelectItem value="Chip">Transponder Chip</SelectItem>
                      <SelectItem value="Original">Original Key</SelectItem>
                      <SelectItem value="Keyless">Keyless</SelectItem>
                      <SelectItem value="OEM">OEM Key</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>  
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>{filteredProducts.length} products found</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier</TableHead>
                      {role === 'admin' && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md"
                          />
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>₦{product.price}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={product.stock <= product.minStock ? "text-orange-600 font-medium" : ""}>
                            {product.stock}
                          </span>
                          <span className="text-xs text-gray-500">Min: {product.minStock}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                      <TableCell>{product.supplier}</TableCell>
                      {role === 'admin' && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteProduct(product._id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
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

