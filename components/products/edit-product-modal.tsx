"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { updateProduct } from "@/app/actions/product-actions"

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  userId: number
}

export default function EditProductModal({ isOpen, onClose, product, userId }: EditProductModalProps) {
  const [name, setName] = useState(product.name || "")
  const [category, setCategory] = useState(product.category || "")
  const [description, setDescription] = useState(product.description || "")
  const [price, setPrice] = useState(product.price?.toString() || "")
  const [stock, setStock] = useState(product.stock?.toString() || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (product) {
      setName(product.name || "")
      setCategory(product.category || "")
      setDescription(product.description || "")
      setPrice(product.price?.toString() || "")
      setStock(product.stock?.toString() || "")
    }
  }, [product])

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
      formData.append("id", product.id.toString())
      formData.append("name", name)
      formData.append("category", category)
      formData.append("description", description)
      formData.append("price", price)
      formData.append("stock", stock || "0")
      formData.append("user_id", userId.toString())

      const result = await updateProduct(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update product error:", error)
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
          <DialogTitle>Edit Product</DialogTitle>
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
              <Label htmlFor="stock">Stock</Label>
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
            {isSubmitting ? "Updating..." : "Update Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

