"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getStockHistory(productId?: number, userId?: number) {
  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    let stockHistory

    if (productId) {
      // Get stock history for a specific product
      stockHistory = await sql`
        SELECT 
          sh.*,
          p.name as product_name,
          p.category,
          u.name as user_name
        FROM stock_movements sh
        JOIN products p ON sh.product_id = p.id
        JOIN users u ON sh.created_by = u.id
        WHERE sh.product_id = ${productId}
        ORDER BY sh.created_at DESC
      `
    } else if (userId) {
      // Get stock history for all products created by this user
      stockHistory = await sql`
        SELECT 
          sh.*,
          p.name as product_name,
          p.category,
          u.name as user_name
        FROM stock_movements sh
        JOIN products p ON sh.product_id = p.id
        JOIN users u ON sh.created_by = u.id
        WHERE p.created_by = ${userId}
        ORDER BY sh.created_at DESC
      `
    } else {
      // Get all stock history
      stockHistory = await sql`
        SELECT 
          sh.*,
          p.name as product_name,
          p.category,
          u.name as user_name
        FROM stock_movements sh
        JOIN products p ON sh.product_id = p.id
        JOIN users u ON sh.created_by = u.id
        ORDER BY sh.created_at DESC
      `
    }

    return { success: true, data: stockHistory }
  } catch (error) {
    console.error("Get stock history error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

export async function getLowStockProducts(userId: number, threshold = 10) {
  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const lowStockProducts = await sql`
      SELECT *
      FROM products
      WHERE stock <= ${threshold} AND created_by = ${userId}
      ORDER BY stock ASC
    `

    return { success: true, data: lowStockProducts }
  } catch (error) {
    console.error("Get low stock products error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

export async function addStockMovement(formData: FormData) {
  const productId = Number.parseInt(formData.get("product_id") as string)
  const quantity = Number.parseInt(formData.get("quantity") as string)
  const type = formData.get("type") as string // 'in' or 'out'
  const source = formData.get("source") as string // 'purchase', 'sale', 'adjustment', etc.
  const referenceId = formData.get("reference_id") ? Number.parseInt(formData.get("reference_id") as string) : null
  const notes = formData.get("notes") as string
  const userId = Number.parseInt(formData.get("user_id") as string)

  if (!productId || !quantity || !type || !source || !userId) {
    return { success: false, message: "Product ID, quantity, type, source, and user ID are required" }
  }

  if (type !== "in" && type !== "out") {
    return { success: false, message: "Type must be 'in' or 'out'" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Get current product stock
    const product = await sql`SELECT * FROM products WHERE id = ${productId}`

    if (product.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Product not found" }
    }

    // Calculate new stock
    let newStock
    if (type === "in") {
      newStock = product[0].stock + quantity
    } else {
      newStock = product[0].stock - quantity

      // Check if we have enough stock
      if (newStock < 0) {
        await sql`ROLLBACK`
        return { success: false, message: "Insufficient stock for this operation" }
      }
    }

    // Update product stock
    await sql`
      UPDATE products
      SET stock = ${newStock}, updated_at = NOW()
      WHERE id = ${productId}
    `

    // Add stock movement record
    const result = await sql`
      INSERT INTO stock_movements (
        product_id, quantity, type, source, reference_id, notes, created_by
      ) VALUES (
        ${productId}, ${quantity}, ${type}, ${source}, ${referenceId}, ${notes}, ${userId}
      )
      RETURNING *
    `

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return { success: true, message: "Stock movement recorded successfully", data: result[0] }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Add stock movement error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function getStockSummary(userId: number) {
  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Get total products
    const totalProducts = await sql`
      SELECT COUNT(*) as count
      FROM products
      WHERE created_by = ${userId}
    `

    // Get total stock value
    const stockValue = await sql`
      SELECT SUM(stock * price) as value
      FROM products
      WHERE created_by = ${userId}
    `

    // Get low stock count
    const lowStockCount = await sql`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock <= 10 AND created_by = ${userId}
    `

    // Get out of stock count
    const outOfStockCount = await sql`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock = 0 AND created_by = ${userId}
    `

    // Get recent stock movements
    const recentMovements = await sql`
      SELECT 
        sm.*,
        p.name as product_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      WHERE p.created_by = ${userId}
      ORDER BY sm.created_at DESC
      LIMIT 5
    `

    return {
      success: true,
      data: {
        totalProducts: totalProducts[0].count,
        stockValue: stockValue[0].value || 0,
        lowStockCount: lowStockCount[0].count,
        outOfStockCount: outOfStockCount[0].count,
        recentMovements,
      },
    }
  } catch (error) {
    console.error("Get stock summary error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: {
        totalProducts: 0,
        stockValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        recentMovements: [],
      },
    }
  }
}

