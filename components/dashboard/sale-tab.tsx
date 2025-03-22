"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Eye, Edit, Trash2, Printer, ChevronLeft, ChevronRight } from "lucide-react"
import { getUserSales, deleteSale } from "@/app/actions/sale-actions"
import SaleModal from "../sales/sale-modal"
import ViewSaleModal from "../sales/view-sale-modal"
import EditSaleModal from "../sales/edit-sale-modal"
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

interface SaleTabProps {
  userId: number
  isAddModalOpen?: boolean
  onModalClose?: () => void
}

export default function SaleTab({ userId, isAddModalOpen = false, onModalClose }: SaleTabProps) {
  const [allSales, setAllSales] = useState<any[]>([])
  const [filteredSales, setFilteredSales] = useState<any[]>([])
  const [displayedSales, setDisplayedSales] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
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
      setIsSaleModalOpen(true)
    }
  }, [isAddModalOpen])

  useEffect(() => {
    const fetchSales = async () => {
      if (!userId) return

      try {
        setIsLoading(true)
        const result = await getUserSales(userId)
        if (result.success) {
          setAllSales(result.data)
        } else {
          // If error, use empty array
          setAllSales([])
        }
      } catch (error) {
        console.error("Error fetching sales:", error)
        setAllSales([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSales()
  }, [userId, isSaleModalOpen, isEditModalOpen]) // Refetch when modals close

  // Apply filters whenever allSales, statusFilter, or searchTerm changes
  useEffect(() => {
    let filtered = [...allSales]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((sale) => sale.status === statusFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (sale) =>
          (sale.customer_name && sale.customer_name.toLowerCase().includes(term)) ||
          sale.id.toString().includes(term) ||
          sale.total_amount.toString().includes(term),
      )
    }

    setFilteredSales(filtered)
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)))
    setCurrentPage(1) // Reset to first page when filters change
  }, [allSales, statusFilter, searchTerm, itemsPerPage])

  // Update displayed sales whenever filteredSales or pagination changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedSales(filteredSales.slice(startIndex, endIndex))
  }, [filteredSales, currentPage, itemsPerPage])

  const handleAddSale = () => {
    setIsSaleModalOpen(true)
  }

  const handleViewSale = (sale: any) => {
    setSelectedSale(sale)
    setIsViewModalOpen(true)
  }

  const handleEditSale = (sale: any) => {
    setSelectedSale(sale)
    setIsEditModalOpen(true)
  }

  const handleDeleteSale = (sale: any) => {
    setSelectedSale(sale)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedSale) return

    setIsDeleting(true)
    try {
      const result = await deleteSale(selectedSale.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Sale deleted successfully",
        })
        // Remove sale from state
        setAllSales(allSales.filter((s) => s.id !== selectedSale.id))
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete sale",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete sale error:", error)
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
    setIsSaleModalOpen(false)
    if (onModalClose) onModalClose()
  }

  // Add the handlePrintInvoice function
  const handlePrintInvoice = async (sale: any) => {
    try {
      // Redirect to the invoice page with the sale ID
      window.open(`/invoice/sale/${sale.id}`, "_blank")
    } catch (error) {
      console.error("Print invoice error:", error)
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      })
    }
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
              placeholder="Search sales..."
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
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>
        {/* <Button
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition-all hover:bg-blue-700"
          onClick={handleAddSale}
        >
          <Plus className="h-4 w-4" />
          <span>Add Sale</span>
        </Button> */}
      </div>

      <div className="space-y-4">
        {displayedSales.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No sales found. Create your first sale!</p>
          </div>
        ) : (
          displayedSales.map((sale) => (
            <Card key={sale.id} className="overflow-hidden rounded-xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h3 className="font-medium">{sale.customer_name || "Walk-in Customer"}</h3>
                    {/* <p className="text-sm text-gray-500">{sale.sale_date}</p> */}
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <p className="font-medium">${sale.total_amount}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        sale.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : sale.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sale.status}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewSale(sale)} className="h-8 w-8">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditSale(sale)} className="h-8 w-8">
                        <Edit className="h-4 w-4 text-amber-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrintInvoice(sale)} className="h-8 w-8">
                        <Printer className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale)} className="h-8 w-8">
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
      {filteredSales.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} sales
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

      {/* Sale Modal */}
      <SaleModal isOpen={isSaleModalOpen} onClose={handleModalClose} userId={userId} />

      {/* View Sale Modal */}
      {selectedSale && (
        <ViewSaleModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} saleId={selectedSale.id} />
      )}

      {/* Edit Sale Modal */}
      {selectedSale && (
        <EditSaleModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          saleId={selectedSale.id}
          userId={userId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this sale and restore product stock.
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

