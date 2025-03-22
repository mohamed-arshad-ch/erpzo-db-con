"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { updateCustomer } from "@/app/actions/customer-actions"

interface EditCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer: any
  userId: number
}

export default function EditCustomerModal({ isOpen, onClose, customer, userId }: EditCustomerModalProps) {
  const [name, setName] = useState(customer.name || "")
  const [email, setEmail] = useState(customer.email || "")
  const [phone, setPhone] = useState(customer.phone || "")
  const [address, setAddress] = useState(customer.address || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (customer) {
      setName(customer.name || "")
      setEmail(customer.email || "")
      setPhone(customer.phone || "")
      setAddress(customer.address || "")
    }
  }, [customer])

  const handleSubmit = async () => {
    if (!name) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("id", customer.id.toString())
      formData.append("name", name)
      formData.append("email", email)
      formData.append("phone", phone)
      formData.append("address", address)
      formData.append("user_id", userId.toString())

      const result = await updateCustomer(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update customer",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update customer error:", error)
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Customer address"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

