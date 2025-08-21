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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, DollarSign, Users, AlertCircle, CreditCard, Eye, Plus } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { Sale } from "@/lib/sales"
import { toast } from "sonner"

export default function CustomersPage() {
  const [partialPayments, setPartialPayments] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [additionalPayment, setAdditionalPayment] = useState("")
  const [role, setRole] = useState<'admin' | 'user' | null>(null)

  useEffect(() => {
    fetchPartialPayments()
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

  const fetchPartialPayments = async () => {
    try {
      const response = await fetch('/api/sales/partial-payments')
      if (response.ok) {
        const data = await response.json()
        setPartialPayments(data)
      }
    } catch (error) {
      console.error('Error fetching partial payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdditionalPayment = async () => {
    if (!selectedSale || !additionalPayment) {
      toast.warning("Please enter a valid payment amount")
      return
    }

    const paymentAmount = parseFloat(additionalPayment)
    if (paymentAmount <= 0 || paymentAmount > (selectedSale.remainingBalance || 0)) {
      toast.warning("Payment amount must be greater than 0 and not exceed remaining balance")
      return
    }

    try {
      const response = await fetch(`/api/sales/${selectedSale._id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ additionalPayment: paymentAmount }),
      })

      if (response.ok) {
        toast.success("Payment recorded successfully!")
        setAdditionalPayment("")
        setIsPaymentDialogOpen(false)
        setSelectedSale(null)
        fetchPartialPayments() // Refresh data
      } else {
        toast.error("Failed to record payment")
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      toast.error("An error occurred while recording the payment")
    }
  }

  const filteredPayments = partialPayments.filter(
    (payment) =>
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.customerPhone && payment.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalOutstanding = partialPayments.reduce((sum, payment) => sum + (payment.remainingBalance || 0), 0)
  const totalCustomers = partialPayments.length
  const avgDebt = totalCustomers > 0 ? totalOutstanding / totalCustomers : 0

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading customer data...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600">Manage customers with partial payments and outstanding balances</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                {/* <DollarSign className="h-4 w-4 text-red-500" /> */}₦
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₦{totalOutstanding.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Amount owed by customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers with Debt</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Customers with partial payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Debt</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">₦{avgDebt.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Average outstanding per customer</p>
              </CardContent>
            </Card>
          </div>

          {/* Partial Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customers with Partial Payments</CardTitle>
              <CardDescription>
                {filteredPayments.length} customers with outstanding balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Partial Payments</h3>
                  <p className="text-gray-500">All customers have completed their payments.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Remaining Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.customerName}</div>
                            {payment.customerPhone && (
                              <div className="text-sm text-gray-500">{payment.customerPhone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{payment.invoiceId}</TableCell>
                        <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">₦{payment.total.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                        ₦{(payment.amountPaid || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                        ₦{(payment.remainingBalance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSale(payment)
                                setIsDetailsDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSale(payment)
                                setIsPaymentDialogOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record Additional Payment</DialogTitle>
              <DialogDescription>
                Record an additional payment for {selectedSale?.customerName}
              </DialogDescription>
            </DialogHeader>
            {selectedSale && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Invoice:</Label>
                  <div className="col-span-3 font-mono text-sm">{selectedSale.invoiceId}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Total:</Label>
                  <div className="col-span-3 font-medium">₦{selectedSale.total.toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Paid:</Label>
                  <div className="col-span-3 text-green-600 font-medium">
                  ₦{(selectedSale.amountPaid || 0).toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Remaining:</Label>
                  <div className="col-span-3 text-red-600 font-medium">
                  ₦{(selectedSale.remainingBalance || 0).toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payment" className="text-right">
                    Payment Amount:
                  </Label>
                  <Input
                    id="payment"
                    type="number"
                    step="0.01"
                    max={selectedSale.remainingBalance || 0}
                    className="col-span-3"
                    value={additionalPayment}
                    onChange={(e) => setAdditionalPayment(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdditionalPayment}>Record Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>
                Complete details for {selectedSale?.customerName}'s purchase
              </DialogDescription>
            </DialogHeader>
            {selectedSale && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Customer Information</Label>
                    <div className="mt-2 space-y-1">
                      <div>Name: {selectedSale.customerName}</div>
                      {selectedSale.customerPhone && (
                        <div>Phone: {selectedSale.customerPhone}</div>
                      )}
                      <div>Invoice: {selectedSale.invoiceId}</div>
                      <div>Date: {new Date(selectedSale.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Information</Label>
                    <div className="mt-2 space-y-1">
                      <div>Total: ₦{selectedSale.total.toFixed(2)}</div>
                      <div className="text-green-600">Paid: ₦{(selectedSale.amountPaid || 0).toFixed(2)}</div>
                      <div className="text-red-600">Remaining: ₦{(selectedSale.remainingBalance || 0).toFixed(2)}</div>
                      <div>Status: {selectedSale.status}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Items Purchased</Label>
                  <div className="mt-2 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSale.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₦{item.price.toFixed(2)}</TableCell>
                            <TableCell>₦{item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
