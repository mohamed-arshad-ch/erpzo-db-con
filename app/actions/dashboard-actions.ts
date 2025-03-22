"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"

export async function getUserDashboardSummary(userId: number) {
  if (!userId) {
    return {
      success: false,
      message: "User ID is required",
      data: {
        totalSales: 0,
        totalPurchases: 0,
        totalProfit: 0,
        recentSales: [],
        recentPurchases: [],
        lowStockProducts: [],
      },
    }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Get total sales for this user
    const totalSales = await sql`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM sales
    WHERE status != 'Cancelled' AND created_by = ${userId}
  `

    // Get total purchases for this user
    const totalPurchases = await sql`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM purchases
    WHERE status != 'Cancelled' AND created_by = ${userId}
  `

    // Calculate profit (simplified)
    const totalProfit = totalSales[0].total - totalPurchases[0].total

    // Get recent sales for this user
    const recentSales = await sql`
    SELECT s.*, c.name as customer_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.created_by = ${userId}
    ORDER BY s.sale_date DESC
    LIMIT 5
  `

    // Get recent purchases for this user
    const recentPurchases = await sql`
    SELECT p.*
    FROM purchases p
    WHERE p.created_by = ${userId}
    ORDER BY p.purchase_date DESC
    LIMIT 5
  `

    // Get low stock products
    const lowStockProducts = await sql`
    SELECT *
    FROM products
    WHERE stock <= 10 AND created_by = ${userId}
    ORDER BY stock ASC
    LIMIT 5
  `

    // Get top customers for this user
    const topCustomers = await sql`
    SELECT c.*, COUNT(s.id) as order_count, SUM(s.total_amount) as total_spent
    FROM customers c
    JOIN sales s ON c.id = s.customer_id
    WHERE s.status != 'Cancelled' AND s.created_by = ${userId}
    GROUP BY c.id
    ORDER BY total_spent DESC
    LIMIT 5
  `

    return {
      success: true,
      data: {
        totalSales: totalSales[0].total,
        totalPurchases: totalPurchases[0].total,
        totalProfit,
        recentSales,
        recentPurchases,
        lowStockProducts,
        topCustomers,
      },
    }
  } catch (error) {
    console.error("Get user dashboard summary error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: {
        totalSales: 0,
        totalPurchases: 0,
        totalProfit: 0,
        recentSales: [],
        recentPurchases: [],
        lowStockProducts: [],
        topCustomers: [],
      },
    }
  }
}

