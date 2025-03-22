"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { getProductStockHistory } from "@/app/actions/product-actions"

interface ViewProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onAdjustStock?: () => void
}

export default function ViewProductModal({ isOpen, onClose, product, onAdjustStock }: ViewProductModalProps) {
  const [stockHistory, setStockHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchStockHistory = async () => {
      if (!isOpen || !product?.id) return

      try {
        setIsLoading(true)
        const result = await getProductStockHistory(product.id)
        if (result.success) {
          setStockHistory(result.data)
        }
      } catch (error) {
        console.error("Error fetching stock history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStockHistory()
  }, [isOpen, product?.id])

  // Helper function to get type label and color
  const getTypeInfo = (type: string, referenceType: string) => {
    if (type === "purchase") {
      return { label: "Purchase", color: "bg-green-100 text-green-800" }
    } else if (type === "sale") {
      return { label: "Sale", color: "bg-red-100 text-red-800" }
    } else if (type === "adjustment") {
      if (referenceType === "manual") {
        return { label: "Adjustment", color: "bg-blue-100 text-blue-800" }
      }
      return { label: "Adjustment", color: "bg-purple-100 text-purple-800" }
    }
    return { label: type, color: "bg-gray-100 text-gray-800" }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="font-medium">{product.name}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p>{product.category || "N/A"}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p>{product.description || "No description available"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Price</h3>
                <p className="font-medium">${product.price}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Current Stock</h3>
                <p className="font-medium">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.stock > 20
                        ? "bg-green-100 text-green-800"
                        : product.stock > 10
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.stock}{" "}
                    {product.stock > 20 ? "In Stock" : product.stock > 10 ? "Low Stock" : "Critical Stock"}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p>{product.created_at ? format(new Date(product.created_at), "PPP p") : "N/A"}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p>{product.updated_at ? format(new Date(product.updated_at), "PPP p") : "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Stock History Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Stock History</h3>
              {onAdjustStock && (
                <Button size="sm" onClick={onAdjustStock}>
                  Adjust Stock
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
              </div>
            ) : stockHistory.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                        Date
                      </th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                        Type
                      </th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockHistory.map((item) => {
                      const typeInfo = getTypeInfo(item.type, item.reference_type)
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{format(new Date(item.date), "PPP")}</td>
                          <td className="px-4 py-2 text-sm">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeInfo.color}`}
                            >
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-center">
                            {item.type === "sale" ? "-" : "+"}
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.notes || "-"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4">No stock history available</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

