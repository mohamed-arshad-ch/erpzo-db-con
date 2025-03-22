"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserDashboardSummary } from "@/app/actions/dashboard-actions"
import { formatDate } from "@/lib/db"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HomeTabProps {
  userId: number
}

export default function HomeTab({ userId }: HomeTabProps) {
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      if (!userId) return

      try {
        const result = await getUserDashboardSummary(userId)
        if (result.success) {
          setSummary(result.data)
        } else {
          setError(result.message || "Failed to load dashboard data")
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("An error occurred while loading dashboard data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSummary()
  }, [userId])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl shadow-md">
          <CardContent className="p-6">
            <div className="h-24 animate-pulse bg-gray-200 rounded-md"></div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-2xl shadow-md">
          <CardContent className="p-6">
            <div className="h-24 animate-pulse bg-gray-200 rounded-md"></div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-2xl shadow-md">
          <CardContent className="p-6">
            <div className="h-24 animate-pulse bg-gray-200 rounded-md"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <SummaryCard
            title="Total Sales"
            value={`$${0}`}
            icon={<DollarSign className="h-6 w-6 text-green-500" />}
            trend="--"
            trendUp={true}
          />
          <SummaryCard
            title="Total Purchases"
            value={`$${0}`}
            icon={<ShoppingCart className="h-6 w-6 text-blue-500" />}
            trend="--"
            trendUp={true}
          />
          <SummaryCard
            title="Total Profit"
            value={`$${0}`}
            icon={<TrendingUp className="h-6 w-6 text-purple-500" />}
            trend="--"
            trendUp={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard
          title="Total Sales"
          value={`$${summary.totalSales}`}
          icon={<DollarSign className="h-6 w-6 text-green-500" />}
          trend="+12.5%"
          trendUp={true}
        />
        <SummaryCard
          title="Total Purchases"
          value={`$${summary.totalPurchases}`}
          icon={<ShoppingCart className="h-6 w-6 text-blue-500" />}
          trend="+8.2%"
          trendUp={true}
        />
        <SummaryCard
          title="Total Profit"
          value={`$${summary.totalProfit}`}
          icon={<TrendingUp className="h-6 w-6 text-purple-500" />}
          trend="+15.3%"
          trendUp={true}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              {summary.recentSales.length > 0 ? (
                <div className="space-y-3">
                  {summary.recentSales.map((sale: any) => (
                    <Card key={sale.id} className="overflow-hidden rounded-xl shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <div>
                            <h3 className="font-medium">{sale.customer_name || "Walk-in Customer"}</h3>
                            <p className="text-sm text-gray-500">{formatDate(sale.sale_date)}</p>
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">No recent sales found.</div>
              )}
            </TabsContent>

            <TabsContent value="purchases">
              {summary.recentPurchases && summary.recentPurchases.length > 0 ? (
                <div className="space-y-3">
                  {summary.recentPurchases.map((purchase: any) => (
                    <Card key={purchase.id} className="overflow-hidden rounded-xl shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <div>
                            <h3 className="font-medium">{purchase.supplier || "Unknown Supplier"}</h3>
                            <p className="text-sm text-gray-500">{formatDate(purchase.purchase_date)}</p>
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">No recent purchases found.</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {summary.lowStockProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Low Stock Products</h2>
          <div className="space-y-3">
            {summary.lowStockProducts.map((product: any) => (
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
                          product.stock > 5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.stock > 5 ? "Low Stock" : "Critical Stock"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend: string
  trendUp: boolean
}

function SummaryCard({ title, value, icon, trend, trendUp }: SummaryCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="mt-1 text-2xl font-bold">{value}</h3>
            <div className={`mt-1 flex items-center text-sm ${trendUp ? "text-green-600" : "text-red-600"}`}>
              <span>{trend}</span>
              <span className="ml-1 text-xs">vs last month</span>
            </div>
          </div>
          <div className="rounded-full bg-gray-100 p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

