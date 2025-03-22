"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { addProduct } from "@/app/actions/product-actions"

interface NewProductModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: (productId: number, productName: string, price: number) => void
  userId: number
}

export default function NewProductModal({ isOpen, onClose, onProductAdded, userId }: NewProductModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!name || !price) {
      toast({
        title: "Error",
        description: "Product name and price are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("category", category)
      formData.append("description", description)
      formData.append("price", price)
      formData.append("stock", stock || "0")
      formData.append("user_id", userId.toString())

      const result = await addProduct(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Product added successfully",
        })
        onProductAdded(result.data.id, result.data.name, result.data.price)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Add product error:", error)
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
    setName("")
    setCategory("")
    setDescription("")
    setPrice("")
    setStock("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
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
              placeholder="Product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Product category"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Initial Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

