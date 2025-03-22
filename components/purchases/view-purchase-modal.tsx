"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getPurchaseDetails } from "@/app/actions/purchase-actions"
import { format } from "date-fns"

interface ViewPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: number
}

export default function ViewPurchaseModal({ isOpen, onClose, purchaseId }: ViewPurchaseModalProps) {
  const [purchase, setPurchase] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      if (!purchaseId) return

      try {
        setIsLoading(true)
        const result = await getPurchaseDetails(purchaseId)

        if (result.success) {
          setPurchase(result.data.purchase)
          setItems(result.data.items)
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

    if (isOpen) {
      fetchPurchaseDetails()
    }
  }, [purchaseId, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : purchase ? (
          <div className="space-y-6">
            {/* Purchase Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                <p className="font-medium">{purchase.supplier}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Purchase Date</h3>
                <p className="font-medium">
                  {purchase.purchase_date ? format(new Date(purchase.purchase_date), "PPP") : "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      purchase.status === "Received"
                        ? "bg-green-100 text-green-800"
                        : purchase.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {purchase.status}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="font-medium">${purchase.total_amount}</p>
              </div>
            </div>

            {/* Purchase Items */}
            <div className="space-y-3">
              <h3 className="font-medium">Items</h3>

              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Total</div>
                </div>

                {items.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No items found</div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-3 border-t">
                      <div className="col-span-6">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                      <div className="col-span-2 text-center">{item.quantity}</div>
                      <div className="col-span-2 text-center">${item.price}</div>
                      <div className="col-span-2 text-center">${(item.quantity * item.price)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
              <h3 className="font-medium">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Created At</p>
                  <p>{purchase.created_at ? format(new Date(purchase.created_at), "PPP p") : "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p>{purchase.updated_at ? format(new Date(purchase.updated_at), "PPP p") : "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Purchase not found</div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

