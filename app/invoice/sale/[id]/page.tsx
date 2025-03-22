"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSaleDetails } from "@/app/actions/sale-actions"
import { format } from "date-fns"
import { Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

export default function SaleInvoicePage() {
  const params = useParams()
  const saleId = Number(params.id)

  const [sale, setSale] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (!saleId) return

      try {
        setIsLoading(true)
        const result = await getSaleDetails(saleId)

        if (result.success) {
          setSale(result.data.sale)
          setItems(result.data.items)
        } else {
          setError(result.message || "Failed to load sale details")
        }
      } catch (error) {
        console.error("Error fetching sale details:", error)
        setError("An error occurred while loading sale details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSaleDetails()
  }, [saleId])

  const generatePDF = () => {
    if (!sale) return

    // Create a new jsPDF instance
    const doc = new jsPDF()

    // Add company logo/header
    doc.setFontSize(20)
    doc.setTextColor(0, 51, 153)
    doc.text("INVOICE", 105, 20, { align: "center" })

    // Add company info
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text("Your Company Name", 20, 30)
    doc.text("123 Business Street", 20, 35)
    doc.text("City, State ZIP", 20, 40)
    doc.text("Phone: (123) 456-7890", 20, 45)
    doc.text("Email: info@yourcompany.com", 20, 50)

    // Add invoice details
    doc.setFontSize(10)
    doc.text(`Invoice #: INV-${sale.id.toString().padStart(5, "0")}`, 140, 30)
    doc.text(`Date: ${format(new Date(sale.sale_date), "PPP")}`, 140, 35)
    doc.text(`Status: ${sale.status}`, 140, 40)

    // Add customer info
    doc.setFontSize(12)
    doc.text("Bill To:", 20, 65)
    doc.setFontSize(10)
    doc.text(sale.customer_name || "Walk-in Customer", 20, 70)

    // Add items table
    const tableColumn = ["#", "Product", "Quantity", "Price", "Total"]
    const tableRows = items.map((item, index) => [
      index + 1,
      item.product_name,
      item.quantity,
      `$${item.price.toFixed(2)}`,
      `$${(item.quantity * item.price).toFixed(2)}`,
    ])

    // @ts-ignore - jspdf-autotable types are not included
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 51, 153] },
    })

    // Add totals
    // @ts-ignore - jspdf-autotable types are not included
    const finalY = doc.lastAutoTable.finalY || 120

    doc.setFontSize(10)
    doc.text("Subtotal:", 140, finalY + 10)
    doc.text(`$${sale.total_amount.toFixed(2)}`, 170, finalY + 10, { align: "right" })

    doc.text("Tax:", 140, finalY + 15)
    doc.text("$0.00", 170, finalY + 15, { align: "right" })

    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text("Total:", 140, finalY + 25)
    doc.text(`$${sale.total_amount.toFixed(2)}`, 170, finalY + 25, { align: "right" })

    // Add footer
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text("Thank you for your business!", 105, finalY + 40, { align: "center" })

    // Save the PDF
    doc.save(`Invoice-${sale.id.toString().padStart(5, "0")}.pdf`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sale Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoice #{sale.id.toString().padStart(5, "0")}</h1>
        <Button onClick={generatePDF} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          <span>Download PDF</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Your Company</h2>
            <p>123 Business Street</p>
            <p>City, State ZIP</p>
            <p>Phone: (123) 456-7890</p>
            <p>Email: info@yourcompany.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold mb-2">Invoice Details</h2>
            <p>Invoice #: INV-{sale.id.toString().padStart(5, "0")}</p>
            <p>Date: {format(new Date(sale.sale_date), "PPP")}</p>
            <p>Status: {sale.status}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Bill To</h2>
          <p>{sale.customer_name || "Walk-in Customer"}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">#</th>
                  <th className="py-2 px-4 border-b text-left">Product</th>
                  <th className="py-2 px-4 border-b text-right">Quantity</th>
                  <th className="py-2 px-4 border-b text-right">Price</th>
                  <th className="py-2 px-4 border-b text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 px-4">{index + 1}</td>
                    <td className="py-2 px-4">{item.product_name}</td>
                    <td className="py-2 px-4 text-right">{item.quantity}</td>
                    <td className="py-2 px-4 text-right">${item.price.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="font-medium">Subtotal:</span>
              <span>${sale.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Tax:</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 font-bold">
              <span>Total:</span>
              <span>${sale.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}

