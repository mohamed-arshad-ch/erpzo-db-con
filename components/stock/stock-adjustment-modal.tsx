"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { addStockMovement } from "@/app/actions/stock-actions"

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  userId: number
}

export default function StockAdjustmentModal({ isOpen, onClose, product, userId }: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState("1")
  const [type, setType] = useState("in")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const handleSubmit = async () => {
    const quantityNum = Number.parseInt(quantity)

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity greater than zero",
        variant: "destructive",
      })
      return
    }

    // For decrease, check if we have enough stock
    if (type === "out" && quantityNum > product.stock) {
      toast({
        title: "Error",
        description: "Cannot decrease more than current stock",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("product_id", product.id.toString())
      formData.append("quantity", quantity)
      formData.append("type", type)
      formData.append("source", "adjustment")
      formData.append("notes", notes)
      formData.append("user_id", userId.toString())

      const result = await addStockMovement(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        resetForm()
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to adjust stock",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Adjust stock error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setQuantity("1")
    setType("in")
    setNotes("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock for {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Current Stock: {product?.stock || 0}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Adjustment Type</Label>
            <RadioGroup value={type} onValueChange={setType} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in" id="in" />
                <Label htmlFor="in" className="cursor-pointer">
                  Increase
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="out" id="out" />
                <Label htmlFor="out" className="cursor-pointer">
                  Decrease
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment (optional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adjusting..." : "Adjust Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

