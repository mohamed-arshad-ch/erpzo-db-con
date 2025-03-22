"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getUserSales(userId: number) {
  if (!userId) {
    return { success: false, message: "User ID is required", data: [] }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const sales = await sql`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.created_by = ${userId}
      ORDER BY s.sale_date DESC
    `

    return { success: true, data: sales }
  } catch (error) {
    console.error("Get user sales error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

export async function getSaleDetails(saleId: number) {
  if (!saleId) {
    return { success: false, message: "Sale ID is required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const saleResult = await sql`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ${saleId}
    `

    if (saleResult.length === 0) {
      return { success: false, message: "Sale not found" }
    }

    const itemsResult = await sql`
      SELECT si.*, p.name as product_name, p.category
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ${saleId}
    `

    return {
      success: true,
      data: {
        sale: saleResult[0],
        items: itemsResult,
      },
    }
  } catch (error) {
    console.error("Get sale details error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function addSale(formData: FormData) {
  const customerId = Number.parseInt(formData.get("customer_id") as string)
  const totalAmount = Number.parseFloat(formData.get("total_amount") as string)
  const status = (formData.get("status") as string) || "Pending"
  const userId = Number.parseInt(formData.get("user_id") as string)

  // Parse items from JSON string
  const itemsJson = formData.get("items") as string
  let items = []

  try {
    items = JSON.parse(itemsJson)
  } catch (e) {
    return { success: false, message: "Invalid items format" }
  }

  if (isNaN(totalAmount) || items.length === 0 || !userId) {
    return { success: false, message: "Total amount, at least one item, and user ID are required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Create the sale
    const saleResult = await sql`
      INSERT INTO sales (customer_id, total_amount, status, created_by, sale_date, updated_at)
      VALUES (${customerId || null}, ${totalAmount}, ${status}, ${userId}, NOW(), NOW())
      RETURNING *
    `

    if (saleResult.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Failed to create sale" }
    }

    const saleId = saleResult[0].id

    // Add sale items
    for (const item of items) {
      // Check stock
      const product = await sql`SELECT stock FROM products WHERE id = ${item.product_id}`

      if (product.length === 0 || product[0].stock < item.quantity) {
        await sql`ROLLBACK`
        return { success: false, message: `Insufficient stock for product ID ${item.product_id}` }
      }

      // Add sale item
      await sql`
        INSERT INTO sale_items (sale_id, product_id, quantity, price)
        VALUES (${saleId}, ${item.product_id}, ${item.quantity}, ${item.price})
      `

      // Update stock
      await sql`
        UPDATE products
        SET stock = stock - ${item.quantity}
        WHERE id = ${item.product_id}
      `
    }

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return { success: true, message: "Sale added successfully", data: saleResult[0] }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Add sale error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function updateSale(formData: FormData) {
  const saleId = Number.parseInt(formData.get("id") as string)
  const customerId = Number.parseInt(formData.get("customer_id") as string)
  const saleDate = formData.get("sale_date") as string
  const totalAmount = Number.parseFloat(formData.get("total_amount") as string)
  const status = (formData.get("status") as string) || "Pending"
  const userId = Number.parseInt(formData.get("user_id") as string)

  // Parse items from JSON string
  const itemsJson = formData.get("items") as string
  let items = []

  try {
    items = JSON.parse(itemsJson)
  } catch (e) {
    return { success: false, message: "Invalid items format" }
  }

  if (!saleId || isNaN(totalAmount) || items.length === 0 || !userId) {
    return { success: false, message: "Sale ID, total amount, at least one item, and user ID are required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Get current sale items to compare with new items
    const currentItems = await sql`SELECT * FROM sale_items WHERE sale_id = ${saleId}`

    // Update the sale
    const saleResult = await sql`
      UPDATE sales 
      SET 
        customer_id = ${customerId || null}, 
        total_amount = ${totalAmount}, 
        status = ${status}, 
        sale_date = ${saleDate}, 
        updated_at = NOW()
      WHERE id = ${saleId}
      RETURNING *
    `

    if (saleResult.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Failed to update sale" }
    }

    // Handle sale items - delete all existing items and add new ones
    // First, restore stock from existing items
    for (const item of currentItems) {
      await sql`
        UPDATE products
        SET stock = stock + ${item.quantity}
        WHERE id = ${item.product_id}
      `
    }

    // Delete existing items
    await sql`DELETE FROM sale_items WHERE sale_id = ${saleId}`

    // Add new items
    for (const item of items) {
      // Check stock
      const product = await sql`SELECT stock FROM products WHERE id = ${item.product_id}`

      if (product.length === 0 || product[0].stock < item.quantity) {
        await sql`ROLLBACK`
        return { success: false, message: `Insufficient stock for product ID ${item.product_id}` }
      }

      // Add sale item
      await sql`
        INSERT INTO sale_items (sale_id, product_id, quantity, price)
        VALUES (${saleId}, ${item.product_id}, ${item.quantity}, ${item.price})
      `

      // Update stock
      await sql`
        UPDATE products
        SET stock = stock - ${item.quantity}
        WHERE id = ${item.product_id}
      `
    }

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return { success: true, message: "Sale updated successfully", data: saleResult[0] }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Update sale error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function deleteSale(saleId: number) {
  if (!saleId) {
    return { success: false, message: "Sale ID is required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Get sale items to restore stock
    const saleItems = await sql`
      SELECT product_id, quantity
      FROM sale_items
      WHERE sale_id = ${saleId}
    `

    // Restore stock for each product
    for (const item of saleItems) {
      await sql`
        UPDATE products
        SET stock = stock + ${item.quantity}
        WHERE id = ${item.product_id}
      `
    }

    // Delete sale items
    await sql`DELETE FROM sale_items WHERE sale_id = ${saleId}`

    // Delete the sale
    const result = await sql`DELETE FROM sales WHERE id = ${saleId} RETURNING id`

    if (result.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Failed to delete sale" }
    }

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return { success: true, message: "Sale deleted successfully" }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Delete sale error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

