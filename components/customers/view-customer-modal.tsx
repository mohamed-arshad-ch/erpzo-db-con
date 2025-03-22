"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface ViewCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer: any
}

export default function ViewCustomerModal({ isOpen, onClose, customer }: ViewCustomerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="font-medium">{customer.name}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p>{customer.email || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p>{customer.phone || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p>{customer.address || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Orders</h3>
              <p>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    customer.order_count > 10 ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {customer.order_count || 0} Orders - {customer.order_count > 10 ? "VIP Customer" : "Regular Customer"}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p>{customer.created_at ? format(new Date(customer.created_at), "PPP p") : "N/A"}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p>{customer.updated_at ? format(new Date(customer.updated_at), "PPP p") : "N/A"}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

