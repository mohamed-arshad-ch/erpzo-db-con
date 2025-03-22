"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { getUserPurchases, deletePurchase } from "@/app/actions/purchase-actions"
import PurchaseModal from "../purchases/purchase-modal"
import ViewPurchaseModal from "../purchases/view-purchase-modal"
import EditPurchaseModal from "../purchases/edit-purchase-modal"
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

interface PurchaseTabProps {
  userId: number
  isAddModalOpen?: boolean
  onModalClose?: () => void
}

export default function PurchaseTab({ userId, isAddModalOpen = false, onModalClose }: PurchaseTabProps) {
  const [allPurchases, setAllPurchases] = useState<any[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<any[]>([])
  const [displayedPurchases, setDisplayedPurchases] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    // Set the modal state based on the prop
    if (isAddModalOpen) {
      setIsPurchaseModalOpen(true)
    }
  }, [isAddModalOpen])

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!userId) return

      try {
        setIsLoading(true)
        const result = await getUserPurchases(userId)
        if (result.success) {
          setAllPurchases(result.data)
        } else {
          // If error, use empty array
          setAllPurchases([])
        }
      } catch (error) {
        console.error("Error fetching purchases:", error)
        setAllPurchases([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchases()
  }, [userId, isPurchaseModalOpen, isEditModalOpen]) // Refetch when modals close

  // Apply filters whenever allPurchases, statusFilter, or searchTerm changes
  useEffect(() => {
    let filtered = [...allPurchases]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((purchase) => purchase.status === statusFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (purchase) =>
          (purchase.supplier && purchase.supplier.toLowerCase().includes(term)) ||
          purchase.id.toString().includes(term) ||
          purchase.total_amount.toString().includes(term),
      )
    }

    setFilteredPurchases(filtered)
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)))
    setCurrentPage(1) // Reset to first page when filters change
  }, [allPurchases, statusFilter, searchTerm, itemsPerPage])

  // Update displayed purchases whenever filteredPurchases or pagination changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedPurchases(filteredPurchases.slice(startIndex, endIndex))
  }, [filteredPurchases, currentPage, itemsPerPage])

  const handleAddPurchase = () => {
    setIsPurchaseModalOpen(true)
  }

  const handleViewPurchase = (purchase: any) => {
    setSelectedPurchase(purchase)
    setIsViewModalOpen(true)
  }

  const handleEditPurchase = (purchase: any) => {
    setSelectedPurchase(purchase)
    setIsEditModalOpen(true)
  }

  const handleDeletePurchase = (purchase: any) => {
    setSelectedPurchase(purchase)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedPurchase) return

    setIsDeleting(true)
    try {
      const result = await deletePurchase(selectedPurchase.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Purchase deleted successfully",
        })
        // Remove purchase from state
        setAllPurchases(allPurchases.filter((p) => p.id !== selectedPurchase.id))
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete purchase",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete purchase error:", error)
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
    setIsPurchaseModalOpen(false)
    if (onModalClose) onModalClose()
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
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
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="w-64">
            <Input
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          {/* <div className="w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>
        {/* <Button
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition-all hover:bg-blue-700"
          onClick={handleAddPurchase}
        >
          <Plus className="h-4 w-4" />
          <span>Add Purchase</span>
        </Button> */}
      </div>

      <div className="space-y-4">
        {displayedPurchases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No purchases found. Create your first purchase!</p>
          </div>
        ) : (
          displayedPurchases.map((purchase) => (
            <Card key={purchase.id} className="overflow-hidden rounded-xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h3 className="font-medium">{purchase.supplier}</h3>
                    {/* <p className="text-sm text-gray-500">{purchase.purchase_date}</p> */}
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <p className="font-medium">${purchase.total_amount}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        purchase.status === "Received"
                          ? "bg-green-100 text-green-800"
                          : purchase.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {purchase.status}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewPurchase(purchase)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPurchase(purchase)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4 text-amber-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePurchase(purchase)}
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

      {/* Pagination */}
      {filteredPurchases.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredPurchases.length)} of {filteredPurchases.length} purchases
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageToShow = currentPage - 2 + i
                if (pageToShow < 1) pageToShow = i + 1
                if (pageToShow > totalPages) pageToShow = totalPages - (4 - i)

                // Ensure we don't show pages less than 1
                if (pageToShow < 1) return null

                return (
                  <Button
                    key={pageToShow}
                    variant={currentPage === pageToShow ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageToShow)}
                    className="w-8 h-8 p-0"
                  >
                    {pageToShow}
                  </Button>
                )
              })}
            </div>
            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      <PurchaseModal isOpen={isPurchaseModalOpen} onClose={handleModalClose} userId={userId} />

      {/* View Purchase Modal */}
      {selectedPurchase && (
        <ViewPurchaseModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          purchaseId={selectedPurchase.id}
        />
      )}

      {/* Edit Purchase Modal */}
      {selectedPurchase && (
        <EditPurchaseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          purchaseId={selectedPurchase.id}
          userId={userId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this purchase and adjust product stock
              accordingly.
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

