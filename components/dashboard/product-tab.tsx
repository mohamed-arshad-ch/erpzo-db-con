"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Eye, Edit, Trash2, BarChart2 } from "lucide-react"
import { getProducts, deleteProduct } from "@/app/actions/product-actions"
import NewProductModal from "../sales/new-product-modal"
import ViewProductModal from "../products/view-product-modal"
import EditProductModal from "../products/edit-product-modal"
import AdjustStockModal from "../products/adjust-stock-modal"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProductTabProps {
  userId: number
  isAddModalOpen?: boolean
  onModalClose?: () => void
}

export default function ProductTab({ userId, isAddModalOpen = false, onModalClose }: ProductTabProps) {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    // Set the modal state based on the prop
    if (isAddModalOpen) {
      setIsProductModalOpen(true)
    }
  }, [isAddModalOpen])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userId) return

      try {
        setIsLoading(true)
        const result = await getProducts(userId)
        if (result.success) {
          setProducts(result.data)
        } else {
          // If error, use empty array
          setProducts([])
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [userId, isProductModalOpen, isEditModalOpen, isAdjustStockModalOpen]) // Refetch when modals close

  const handleAddProduct = () => {
    setIsProductModalOpen(true)
  }

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product)
    setIsViewModalOpen(true)
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product)
    setIsAdjustStockModalOpen(true)
  }

  const handleDeleteProduct = (product: any) => {
    setSelectedProduct(product)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedProduct) return

    setIsDeleting(true)
    try {
      const result = await deleteProduct(selectedProduct.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        // Remove product from state
        setProducts(products.filter((p) => p.id !== selectedProduct.id))
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete product error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const handleModalClose = () => {
    setIsProductModalOpen(false)
    if (onModalClose) onModalClose()
  }

  const handleProductAdded = (productId: number, productName: string, price: number) => {
    // Refresh the product list
    const fetchProducts = async () => {
      if (!userId) return

      try {
        const result = await getProducts(userId)
        if (result.success) {
          setProducts(result.data)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      }
    }

    fetchProducts()
    handleModalClose()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="overflow-hidden rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="h-16 animate-pulse bg-gray-200 rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        {/* <Button
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition-all hover:bg-blue-700"
          onClick={handleAddProduct}
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button> */}
      </div>

      <div className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found. Create your first product!</p>
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden rounded-xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <div className="text-right">
                      <p className="font-medium">${product.price}</p>
                      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.stock > 20
                          ? "bg-green-100 text-green-800"
                          : product.stock > 10
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock > 20 ? "In Stock" : product.stock > 10 ? "Low Stock" : "Critical Stock"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewProduct(product)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProduct(product)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4 text-amber-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAdjustStock(product)}
                        className="h-8 w-8"
                      >
                        <BarChart2 className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Product Modal */}
      <NewProductModal
        isOpen={isProductModalOpen}
        onClose={handleModalClose}
        onProductAdded={handleProductAdded}
        userId={userId}
      />

      {/* View Product Modal */}
      {selectedProduct && (
        <ViewProductModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          product={selectedProduct}
          onAdjustStock={() => {
            setIsViewModalOpen(false)
            setIsAdjustStockModalOpen(true)
          }}
        />
      )}

      {/* Edit Product Modal */}
      {selectedProduct && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={selectedProduct}
          userId={userId}
        />
      )}

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <AdjustStockModal
          isOpen={isAdjustStockModalOpen}
          onClose={() => setIsAdjustStockModalOpen(false)}
          product={selectedProduct}
          userId={userId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              {selectedProduct?.name ? ` "${selectedProduct.name}"` : ""} and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

