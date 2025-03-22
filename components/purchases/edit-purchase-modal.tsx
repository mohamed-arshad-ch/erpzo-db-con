"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import ProductSelect from "../sales/product-select"
import NewProductModal from "../sales/new-product-modal"
import SupplierSelect from "./supplier-select"
import NewSupplierModal from "./new-supplier-modal"
import { getPurchaseDetails, updatePurchase } from "@/app/actions/purchase-actions"

interface EditPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: number
  userId: number
}

interface ProductRow {
  id: string
  productId: number | null
  productName: string
  quantity: number
  price: number
  total: number
  originalItemId?: number // For tracking existing items
}

export default function EditPurchaseModal({ isOpen, onClose, purchaseId, userId }: EditPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [date, setDate] = useState<Date>(new Date())
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [supplierName, setSupplierName] = useState<string>("")
  const [status, setStatus] = useState<string>("Pending")
  const [products, setProducts] = useState<ProductRow[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modals for adding new supplier/product
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)

  const { toast } = useToast()

  // Fetch purchase details when modal opens
  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      if (!purchaseId || !isOpen) return

      try {
        setIsLoading(true)
        const result = await getPurchaseDetails(purchaseId)

        if (result.success) {
          const { purchase, items } = result.data

          // Set purchase data
          setDate(new Date(purchase.purchase_date))
          setSupplierId(purchase.supplier_id)
          setSupplierName(purchase.supplier || "")
          setStatus(purchase.status || "Pending")
          setTotalAmount(purchase.total_amount || 0)

          // Calculate subtotal from items
          const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0)
          setSubtotal(calculatedSubtotal)

          // Estimate tax and discount (if not stored directly)
          // This is an approximation - in a real app, you'd store these values
          if (calculatedSubtotal > 0) {
            const estimatedTaxAmount = Math.round((purchase.total_amount - calculatedSubtotal) * 100) / 100
            if (estimatedTaxAmount > 0) {
              setTaxAmount(estimatedTaxAmount)
              setTaxRate(Math.round((estimatedTaxAmount / calculatedSubtotal) * 100 * 100) / 100)
              setDiscountAmount(0)
            } else {
              setTaxAmount(0)
              setTaxRate(0)
              setDiscountAmount(Math.abs(estimatedTaxAmount))
            }
          }

          // Set product rows
          const productRows = items.map((item: any) => ({
            id: crypto.randomUUID(),
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
            originalItemId: item.id,
          }))

          setProducts(
            productRows.length > 0
              ? productRows
              : [
                  {
                    id: crypto.randomUUID(),
                    productId: null,
                    productName: "",
                    quantity: 1,
                    price: 0,
                    total: 0,
                  },
                ],
          )
        } else {
          setError(result.message || "Failed to load purchase details")
        }
      } catch (error) {
        console.error("Error fetching purchase details:", error)
        setError("An error occurred while loading purchase details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchaseDetails()
  }, [purchaseId, isOpen])

  // Calculate totals whenever products, tax rate, or discount changes
  useEffect(() => {
    const newSubtotal = products.reduce((sum, product) => sum + product.total, 0)
    setSubtotal(newSubtotal)

    const newTaxAmount = newSubtotal * (taxRate / 100)
    setTaxAmount(newTaxAmount)

    setTotalAmount(newSubtotal + newTaxAmount - discountAmount)
  }, [products, taxRate, discountAmount])

  // Add a new product row
  const addProductRow = () => {
    setProducts([
      ...products,
      {
        id: crypto.randomUUID(),
        productId: null,
        productName: "",
        quantity: 1,
        price: 0,
        total: 0,
      },
    ])
  }

  // Remove a product row
  const removeProductRow = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter((product) => product.id !== id))
    }
  }

  // Update product row
  const updateProductRow = (id: string, updates: Partial<ProductRow>) => {
    setProducts(
      products.map((product) => {
        if (product.id === id) {
          const updatedProduct = { ...product, ...updates }
          // Recalculate total if quantity or price changed
          if (updates.quantity !== undefined || updates.price !== undefined) {
            updatedProduct.total = updatedProduct.quantity * updatedProduct.price
          }
          return updatedProduct
        }
        return product
      }),
    )
  }

  // Handle product selection
  const handleProductSelect = (id: string, productId: number, productName: string, price: number) => {
    updateProductRow(id, {
      productId,
      productName,
      price,
      total: products.find((p) => p.id === id)?.quantity || 1 * price,
    })
  }

  // Handle supplier selection
  const handleSupplierChange = (value: string | number | null, name?: string) => {
    if (typeof value === "number") {
      setSupplierId(value)
      setSupplierName(name || "")
    } else if (typeof value === "string") {
      setSupplierId(null)
      setSupplierName(value)
    } else {
      setSupplierId(null)
      setSupplierName("")
    }
  }

  // Handle new supplier added
  const handleNewSupplier = (supplierId: number, supplierName: string) => {
    setSupplierId(supplierId)
    setSupplierName(supplierName)
    setIsNewSupplierModalOpen(false)
  }

  // Handle new product added
  const handleNewProduct = (productId: number, productName: string, price: number) => {
    // Find the first empty product row or the last one
    const targetRow = products.find((p) => !p.productId) || products[products.length - 1]

    if (targetRow) {
      updateProductRow(targetRow.id, {
        productId,
        productName,
        price,
        total: targetRow.quantity * price,
      })
    } else {
      // If no empty row, add a new one
      setProducts([
        ...products,
        {
          id: crypto.randomUUID(),
          productId,
          productName,
          quantity: 1,
          price,
          total: price,
        },
      ])
    }

    setIsNewProductModalOpen(false)
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!supplierId && !supplierName) {
      toast({
        title: "Error",
        description: "Please enter a supplier name",
        variant: "destructive",
      })
      return
    }

    if (!products.every((p) => p.productId && p.quantity > 0)) {
      toast({
        title: "Error",
        description: "Please select products and ensure quantities are greater than zero",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append("id", purchaseId.toString())
      if (supplierId) {
        formData.append("supplier_id", supplierId.toString())
      }
      formData.append("supplier", supplierName)
      formData.append("purchase_date", date.toISOString())
      formData.append("total_amount", totalAmount.toString())
      formData.append("status", status)
      formData.append("user_id", userId.toString())

      // Prepare items
      const items = products.map((p) => ({
        id: p.originalItemId, // Include original ID if it exists
        product_id: p.productId,
        quantity: p.quantity,
        price: p.price,
      }))

      formData.append("items", JSON.stringify(items))

      // Submit form
      const result = await updatePurchase(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Purchase updated successfully",
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update purchase",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update purchase error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <div className="grid gap-6 py-4">
              {/* Supplier and Date Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <SupplierSelect
                    value={supplierId || supplierName}
                    onChange={handleSupplierChange}
                    onAddNew={() => setIsNewSupplierModalOpen(true)}
                    userId={userId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Products</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProductRow}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </div>

                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
                    <div className="col-span-5">Product</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-2 text-center">Total</div>
                    <div className="col-span-1"></div>
                  </div>

                  {products.map((product, index) => (
                    <div key={product.id} className="grid grid-cols-12 gap-2 p-3 border-t">
                      <div className="col-span-5">
                        <ProductSelect
                          value={product.productId}
                          onChange={(productId, productName, price) =>
                            handleProductSelect(product.id, productId, productName, price)
                          }
                          onAddNew={() => setIsNewProductModalOpen(true)}
                          userId={userId}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) =>
                            updateProductRow(product.id, { quantity: Number.parseInt(e.target.value) || 0 })
                          }
                          className="text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={product.price}
                          onChange={(e) =>
                            updateProductRow(product.id, { price: Number.parseFloat(e.target.value) || 0 })
                          }
                          className="text-center"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-center">${product.total}</div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProductRow(product.id)}
                          disabled={products.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Section */}
              <div className="space-y-3 border rounded-md p-4 bg-muted/30">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Tax Rate (%):</span>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number.parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <span>Tax Amount:</span>
                  <span>${taxAmount}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number.parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total Amount:</span>
                  <span>${totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting || isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : "Update Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Supplier Modal */}
      <NewSupplierModal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        onSupplierAdded={handleNewSupplier}
        userId={userId}
      />

      {/* New Product Modal */}
      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onProductAdded={handleNewProduct}
        userId={userId}
      />
    </>
  )
}

