"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Home,
  ShoppingCart,
  Receipt,
  Package,
  User,
  LogOut,
  ChevronDown,
  Plus,
  AlertTriangle,
  BarChart2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { logout, getCurrentUser } from "@/app/actions/auth-actions"
import HomeTab from "./home-tab"
import SaleTab from "./sale-tab"
import PurchaseTab from "./purchase-tab"
import ProductTab from "./product-tab"
import CustomerTab from "./customer-tab"
import StockTab from "./stock-tab"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type TabType = "home" | "sale" | "purchase" | "product" | "customer" | "stock"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First try to get user from localStorage
        const userId = localStorage.getItem("userId")
        const userName = localStorage.getItem("userName")
        const userEmail = localStorage.getItem("userEmail")

        if (userId && userName && userEmail) {
          setUser({
            id: Number.parseInt(userId),
            name: userName,
            email: userEmail,
          })
          setIsLoading(false)
          return
        }

        // If not in localStorage, try to get from server
        const userData = await getCurrentUser()

        if (!userData) {
          // If no user data, redirect to login
          router.push("/")
          return
        }

        // Store user data in localStorage
        localStorage.setItem("userId", userData.id.toString())
        localStorage.setItem("userName", userData.name)
        localStorage.setItem("userEmail", userData.email)

        setUser(userData)
      } catch (error) {
        console.error("Error fetching user:", error)
        setDbError("Database connection error. Using local data if available.")

        // If error, check if we have user data in localStorage
        const userId = localStorage.getItem("userId")
        const userName = localStorage.getItem("userName")
        const userEmail = localStorage.getItem("userEmail")

        if (userId && userName && userEmail) {
          setUser({
            id: Number.parseInt(userId),
            name: userName,
            email: userEmail,
          })
        } else {
          // If no user data in localStorage, redirect to login
          router.push("/")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("userId")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("authToken")

      await logout()
      // The logout function will redirect to the home page
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })

      // Even if server logout fails, clear localStorage and redirect
      localStorage.removeItem("userId")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("authToken")

      router.push("/")
    }
  }

  const handleAddButtonClick = () => {
    setIsAddModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex items-center">
          <div className="mr-2 h-8 w-8 rounded-md bg-blue-600"></div>
          <span className="text-xl font-bold text-blue-600">AppName</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">{user?.name || "User"}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex cursor-pointer items-center gap-2 text-red-600" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-20 pt-6">
        {/* Database Error Alert */}
        {dbError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Connection Error</AlertTitle>
            <AlertDescription>{dbError} Some features may be limited.</AlertDescription>
          </Alert>
        )}

        {/* Add Button - Only show on non-home tabs */}
        {activeTab !== "home" && activeTab !== "stock" && (
          <div className="mb-6 flex justify-end">
            <Button
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition-all hover:bg-blue-700"
              onClick={handleAddButtonClick}
            >
              <Plus className="h-4 w-4" />
              <span>Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </Button>
          </div>
        )}

        {/* Tab Content */}
        <div className="pb-4">
          {activeTab === "home" && <HomeTab userId={user?.id} />}
          {activeTab === "sale" && (
            <SaleTab
              userId={user?.id}
              isAddModalOpen={activeTab === "sale" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )}
          {activeTab === "purchase" && (
            <PurchaseTab
              userId={user?.id}
              isAddModalOpen={activeTab === "purchase" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )}
          {activeTab === "product" && (
            <ProductTab
              userId={user?.id}
              isAddModalOpen={activeTab === "product" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )}
          {activeTab === "customer" && (
            <CustomerTab
              userId={user?.id}
              isAddModalOpen={activeTab === "customer" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )}
          {activeTab === "stock" && <StockTab userId={user?.id} />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex h-16 items-center justify-around rounded-t-xl border-t border-gray-200 bg-white shadow-lg">
        <NavItem icon={<Home />} label="Home" isActive={activeTab === "home"} onClick={() => setActiveTab("home")} />
        <NavItem
          icon={<ShoppingCart />}
          label="Sale"
          isActive={activeTab === "sale"}
          onClick={() => setActiveTab("sale")}
        />
        <NavItem
          icon={<Receipt />}
          label="Purchase"
          isActive={activeTab === "purchase"}
          onClick={() => setActiveTab("purchase")}
        />
        <NavItem
          icon={<Package />}
          label="Product"
          isActive={activeTab === "product"}
          onClick={() => setActiveTab("product")}
        />
        <NavItem
          icon={<User />}
          label="Customer"
          isActive={activeTab === "customer"}
          onClick={() => setActiveTab("customer")}
        />
        <NavItem
          icon={<BarChart2 />}
          label="Stock"
          isActive={activeTab === "stock"}
          onClick={() => setActiveTab("stock")}
        />
      </nav>
    </div>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      className={`flex flex-1 flex-col items-center justify-center transition-colors ${
        isActive ? "text-blue-600" : "text-gray-500"
      }`}
      onClick={onClick}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

