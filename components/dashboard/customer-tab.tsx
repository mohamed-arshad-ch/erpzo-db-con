"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Eye, Edit, Trash2 } from "lucide-react"
import { getCustomers, deleteCustomer } from "@/app/actions/customer-actions"
import NewCustomerModal from "../sales/new-customer-modal"
import ViewCustomerModal from "../customers/view-customer-modal"
import EditCustomerModal from "../customers/edit-customer-modal"
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

interface CustomerTabProps {
  userId: number
  isAddModalOpen?: boolean
  onModalClose?: () => void
}

export default function CustomerTab({ userId, isAddModalOpen = false, onModalClose }: CustomerTabProps) {
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    // Set the modal state based on the prop
    if (isAddModalOpen) {
      setIsCustomerModalOpen(true)
    }
  }, [isAddModalOpen])

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!userId) return

      try {
        setIsLoading(true)
        const result = await getCustomers(userId)
        if (result.success) {
          setCustomers(result.data)
        } else {
          // If error, use empty array
          setCustomers([])
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
        setCustomers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [userId, isCustomerModalOpen, isEditModalOpen]) // Refetch when modals close

  const handleAddCustomer = () => {
    setIsCustomerModalOpen(true)
  }

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setIsViewModalOpen(true)
  }

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setIsEditModalOpen(true)
  }

  const handleDeleteCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCustomer) return

    setIsDeleting(true)
    try {
      const result = await deleteCustomer(selectedCustomer.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        })
        // Remove customer from state
        setCustomers(customers.filter((c) => c.id !== selectedCustomer.id))
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete customer",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete customer error:", error)
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
    setIsCustomerModalOpen(false)
    if (onModalClose) onModalClose()
  }

  const handleCustomerAdded = (customerId: number) => {
    // Refresh the customer list
    const fetchCustomers = async () => {
      if (!userId) return

      try {
        const result = await getCustomers(userId)
        if (result.success) {
          setCustomers(result.data)
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
      }
    }

    fetchCustomers()
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
          onClick={handleAddCustomer}
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </Button> */}
      </div>

      <div className="space-y-4">
        {customers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No customers found. Create your first customer!</p>
          </div>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} className="overflow-hidden rounded-xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h3 className="font-medium">{customer.name}</h3>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <div className="text-right">
                      <p className="font-medium">{customer.order_count || 0} Orders</p>
                      <p className="text-sm text-gray-500">
                        {customer.order_count > 10 ? "VIP Customer" : "Regular Customer"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        customer.order_count > 10 ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {customer.order_count > 10 ? "VIP" : "Regular"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewCustomer(customer)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCustomer(customer)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4 text-amber-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCustomer(customer)}
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

      {/* Customer Modal */}
      <NewCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={handleModalClose}
        onCustomerAdded={handleCustomerAdded}
        userId={userId}
      />

      {/* View Customer Modal */}
      {selectedCustomer && (
        <ViewCustomerModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          customer={selectedCustomer}
        />
      )}

      {/* Edit Customer Modal */}
      {selectedCustomer && (
        <EditCustomerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          customer={selectedCustomer}
          userId={userId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              {selectedCustomer?.name ? ` "${selectedCustomer.name}"` : ""} and remove it from our servers.
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

