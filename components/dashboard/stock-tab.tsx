"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, AlertTriangle, DollarSign, ArrowDown, ArrowUp, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { getStockHistory, getLowStockProducts, getStockSummary } from "@/app/actions/stock-actions"
import { getProducts } from "@/app/actions/product-actions"
import StockAdjustmentModal from "../stock/stock-adjustment-modal"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface StockTabProps {
  userId: number
}

export default function StockTab({ userId }: StockTabProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [stockSummary, setStockSummary] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [stockHistory, setStockHistory] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Filters and pagination for products
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [productCurrentPage, setProductCurrentPage] = useState(1)
  const [productItemsPerPage] = useState(10)
  const [productTotalPages, setProductTotalPages] = useState(1)

  // Filters and pagination for stock history
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all")
  const [filteredHistory, setFilteredHistory] = useState<any[]>([])
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1)
  const [historyItemsPerPage] = useState(10)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)

  const { toast } = useToast()

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        // Fetch stock summary
        const summaryResult = await getStockSummary(userId)
        if (summaryResult.success) {
          setStockSummary(summaryResult.data)
        }

        // Fetch products
        const productsResult = await getProducts(userId)
        if (productsResult.success) {
          setProducts(productsResult.data)
          setFilteredProducts(productsResult.data)
          setProductTotalPages(Math.max(1, Math.ceil(productsResult.data.length / productItemsPerPage)))
        }

        // Fetch stock history
        const historyResult = await getStockHistory(undefined, userId)
        if (historyResult.success) {
          setStockHistory(historyResult.data)
          setFilteredHistory(historyResult.data)
          setHistoryTotalPages(Math.max(1, Math.ceil(historyResult.data.length / historyItemsPerPage)))
        }

        // Fetch low stock products
        const lowStockResult = await getLowStockProducts(userId)
        if (lowStockResult.success) {
          setLowStockProducts(lowStockResult.data)
        }
      } catch (error) {
        console.error("Error fetching stock data:", error)
        toast({
          title: "Error",
          description: "Failed to load stock data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId, toast, isAdjustmentModalOpen])

  // Filter products when search term changes
  useEffect(() => {
    if (productSearchTerm) {
      const term = productSearchTerm.toLowerCase()
      const filtered = products.filter(
        (product) => product.name.toLowerCase().includes(term) || product.category?.toLowerCase().includes(term),
      )
      setFilteredProducts(filtered)
      setProductTotalPages(Math.max(1, Math.ceil(filtered.length / productItemsPerPage)))
      setProductCurrentPage(1)
    } else {
      setFilteredProducts(products)
      setProductTotalPages(Math.max(1, Math.ceil(products.length / productItemsPerPage)))
    }
  }, [productSearchTerm, products, productItemsPerPage])

  // Filter stock history when search term or type filter changes
  useEffect(() => {
    let filtered = [...stockHistory]

    if (historySearchTerm) {
      const term = historySearchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) => item.product_name.toLowerCase().includes(term) || item.notes?.toLowerCase().includes(term),
      )
    }

    if (historyTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === historyTypeFilter)
    }

    setFilteredHistory(filtered)
    setHistoryTotalPages(Math.max(1, Math.ceil(filtered.length / historyItemsPerPage)))
    setHistoryCurrentPage(1)
  }, [historySearchTerm, historyTypeFilter, stockHistory, historyItemsPerPage])

  // Get paginated products
  const getPaginatedProducts = () => {
    const startIndex = (productCurrentPage - 1) * productItemsPerPage
    const endIndex = startIndex + productItemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }

  // Get paginated history
  const getPaginatedHistory = () => {
    const startIndex = (historyCurrentPage - 1) * historyItemsPerPage
    const endIndex = startIndex + historyItemsPerPage
    return filteredHistory.slice(startIndex, endIndex)
  }

  // Handle stock adjustment
  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product)
    setIsAdjustmentModalOpen(true)
  }

  // Pagination handlers for products
  const goToProductPage = (page: number) => {
    if (page >= 1 && page <= productTotalPages) {
      setProductCurrentPage(page)
    }
  }

  // Pagination handlers for history
  const goToHistoryPage = (page: number) => {
    if (page >= 1 && page <= historyTotalPages) {
      setHistoryCurrentPage(page)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden rounded-xl shadow-sm">
              <CardContent className="p-4">
                <div className="h-24 animate-pulse bg-gray-200 rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="h-64 animate-pulse bg-gray-200 rounded-md"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <h3 className="mt-1 text-2xl font-bold">{stockSummary?.totalProducts || 0}</h3>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                    <Package className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Stock Value</p>
                    <h3 className="mt-1 text-2xl font-bold">${stockSummary?.stockValue?.toFixed(2) || "0.00"}</h3>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 text-green-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                    <h3 className="mt-1 text-2xl font-bold">{stockSummary?.lowStockCount || 0}</h3>
                  </div>
                  <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                    <h3 className="mt-1 text-2xl font-bold">{stockSummary?.outOfStockCount || 0}</h3>
                  </div>
                  <div className="rounded-full bg-red-100 p-3 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Stock Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {stockSummary?.recentMovements?.length > 0 ? (
                <div className="space-y-4">
                  {stockSummary.recentMovements.map((movement: any) => (
                    <Card key={movement.id} className="overflow-hidden rounded-xl shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-full p-2 ${
                                movement.type === "in" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                              }`}
                            >
                              {movement.type === "in" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{movement.product_name}</h4>
                              <p className="text-sm text-gray-500">
                                {movement.source.charAt(0).toUpperCase() + movement.source.slice(1)} •{" "}
                                {format(new Date(movement.created_at), "PPP")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${movement.type === "in" ? "text-green-600" : "text-red-600"}`}>
                              {movement.type === "in" ? "+" : "-"}
                              {movement.quantity}
                            </p>
                            <p className="text-sm text-gray-500">{movement.notes || ""}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No recent stock movements found.</div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden rounded-xl shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.category || "Uncategorized"}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">${product.price}</p>
                              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                product.stock === 0
                                  ? "bg-red-100 text-red-800"
                                  : product.stock <= 5
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {product.stock === 0
                                ? "Out of Stock"
                                : product.stock <= 5
                                  ? "Critical Stock"
                                  : "Low Stock"}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => handleAdjustStock(product)}>
                              Adjust
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No low stock products found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="w-64 relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-4">
            {getPaginatedProducts().length === 0 ? (
              <div className="text-center py-8 text-gray-500">No products found.</div>
            ) : (
              getPaginatedProducts().map((product) => (
                <Card key={product.id} className="overflow-hidden rounded-xl shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.category || "Uncategorized"}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">${product.price}</p>
                          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.stock === 0
                              ? "bg-red-100 text-red-800"
                              : product.stock <= 5
                                ? "bg-orange-100 text-orange-800"
                                : product.stock <= 10
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                          }`}
                        >
                          {product.stock === 0
                            ? "Out of Stock"
                            : product.stock <= 5
                              ? "Critical Stock"
                              : product.stock <= 10
                                ? "Low Stock"
                                : "In Stock"}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => handleAdjustStock(product)}>
                          Adjust Stock
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination for products */}
          {filteredProducts.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {(productCurrentPage - 1) * productItemsPerPage + 1} to{" "}
                {Math.min(productCurrentPage * productItemsPerPage, filteredProducts.length)} of{" "}
                {filteredProducts.length} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToProductPage(productCurrentPage - 1)}
                  disabled={productCurrentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, productTotalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageToShow = productCurrentPage - 2 + i
                    if (pageToShow < 1) pageToShow = i + 1
                    if (pageToShow > productTotalPages) pageToShow = productTotalPages - (4 - i)

                    // Ensure we don't show pages less than 1
                    if (pageToShow < 1) return null

                    return (
                      <Button
                        key={pageToShow}
                        variant={productCurrentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToProductPage(pageToShow)}
                        className="w-8 h-8 p-0"
                      >
                        {pageToShow}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToProductPage(productCurrentPage + 1)}
                  disabled={productCurrentPage === productTotalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="w-64 relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search movements..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="w-40">
                <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {getPaginatedHistory().length === 0 ? (
              <div className="text-center py-8 text-gray-500">No stock movements found.</div>
            ) : (
              getPaginatedHistory().map((movement) => (
                <Card key={movement.id} className="overflow-hidden rounded-xl shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-2 ${
                            movement.type === "in" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {movement.type === "in" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{movement.product_name}</h4>
                          <p className="text-sm text-gray-500">
                            {movement.source.charAt(0).toUpperCase() + movement.source.slice(1)} •{" "}
                            {format(new Date(movement.created_at), "PPP")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${movement.type === "in" ? "text-green-600" : "text-red-600"}`}>
                          {movement.type === "in" ? "+" : "-"}
                          {movement.quantity}
                        </p>
                        <p className="text-sm text-gray-500">{movement.notes || ""}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination for history */}
          {filteredHistory.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {(historyCurrentPage - 1) * historyItemsPerPage + 1} to{" "}
                {Math.min(historyCurrentPage * historyItemsPerPage, filteredHistory.length)} of {filteredHistory.length}{" "}
                movements
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToHistoryPage(historyCurrentPage - 1)}
                  disabled={historyCurrentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageToShow = historyCurrentPage - 2 + i
                    if (pageToShow < 1) pageToShow = i + 1
                    if (pageToShow > historyTotalPages) pageToShow = historyTotalPages - (4 - i)

                    // Ensure we don't show pages less than 1
                    if (pageToShow < 1) return null

                    return (
                      <Button
                        key={pageToShow}
                        variant={historyCurrentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToHistoryPage(pageToShow)}
                        className="w-8 h-8 p-0"
                      >
                        {pageToShow}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToHistoryPage(historyCurrentPage + 1)}
                  disabled={historyCurrentPage === historyTotalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <StockAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          product={selectedProduct}
          userId={userId}
        />
      )}
    </>
  )
}

