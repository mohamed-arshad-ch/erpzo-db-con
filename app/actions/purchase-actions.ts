"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getPurchases() {
  try {
    const purchases = await sql`
      SELECT * FROM purchases
      ORDER BY purchase_date DESC
    `

    return { success: true, data: purchases }
  } catch (error) {
    console.error("Get purchases error:", error)
    return { success: false, message: "Failed to fetch purchases" }
  }
}

export async function getUserPurchases(userId: number) {
  if (!userId) {
    return { success: false, message: "User ID is required", data: [] }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const purchases = await sql`
      SELECT *
      FROM purchases
      WHERE created_by = ${userId}
      ORDER BY purchase_date DESC
    `

    return { success: true, data: purchases }
  } catch (error) {
    console.error("Get user purchases error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

export async function getPurchaseDetails(purchaseId: number) {
  try {
    const purchaseItems = await sql`
      SELECT pi.*, p.name as product_name, p.category
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ${purchaseId}
    `

    const purchase = await sql`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ${purchaseId}
    `

    if (purchase.length === 0) {
      return { success: false, message: "Purchase not found" }
    }

    return {
      success: true,
      data: {
        purchase: purchase[0],
        items: purchaseItems,
      },
    }
  } catch (error) {
    console.error("Get purchase details error:", error)
    return { success: false, message: "Failed to fetch purchase details" }
  }
}

export async function addPurchase(formData: FormData) {
  const supplierId = formData.get("supplier_id") ? Number.parseInt(formData.get("supplier_id") as string) : null
  const supplier = formData.get("supplier") as string
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

    // Create the purchase
    const purchaseResult = await sql`
      INSERT INTO purchases (supplier_id, supplier, total_amount, status, created_by, purchase_date)
      VALUES (${supplierId}, ${supplier}, ${totalAmount}, ${status}, ${userId}, NOW())
      RETURNING *
    `

    if (purchaseResult.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Failed to create purchase" }
    }

    const purchaseId = purchaseResult[0].id

    // Add purchase items
    for (const item of items) {
      // Add purchase item
      await sql`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
        VALUES (${purchaseId}, ${item.product_id}, ${item.quantity}, ${item.price})
      `

      // Update stock if status is "Received"
      if (status === "Received") {
        await sql`
          UPDATE products
          SET stock = stock + ${item.quantity}
          WHERE id = ${item.product_id}
        `
      }
    }

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return { success: true, message: "Purchase added successfully", data: purchaseResult[0] }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Add purchase error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function updatePurchase(formData: FormData) {
  const purchaseId = Number.parseInt(formData.get("id") as string)
  const supplierId = formData.get("supplier_id") ? Number.parseInt(formData.get("supplier_id") as string) : null
  const supplier = formData.get("supplier") as string
  const purchaseDate = formData.get("purchase_date") as string
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

  if (!purchaseId || isNaN(totalAmount) || items.length === 0 || !userId) {
    return {
      success: false,
      message: "Purchase ID, total amount, at least one item, and user ID are required",
    }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Get current purchase items to compare with new items
    const currentItems = await sql`SELECT * FROM purchase_items WHERE purchase_id = ${purchaseId}`

    // Update the purchase
    const purchaseResult = await sql`
      UPDATE purchases 
      SET 
        supplier_id = ${supplierId}, 
        supplier = ${supplier}, 
        total_amount = ${totalAmount}, 
        status = ${status}, 
        purchase_date = ${purchaseDate}, 
        updated_at = NOW()
      WHERE id = ${purchaseId}
      RETURNING *
    `

    if (purchaseResult.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Failed to update purchase" }
    }

    // Handle purchase items - delete all existing items and add new ones
    // First, restore stock from existing items if the purchase was previously received
    const originalPurchase = await sql`SELECT status FROM purchases WHERE id = ${purchaseId}`
    if (originalPurchase.length > 0 && originalPurchase[0].status === "Received") {
      for (const item of currentItems) {
        await sql`
          UPDATE products
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.product_id}
        `
      }
    }

    // Delete existing items
    await sql`DELETE FROM purchase_items WHERE purchase_id = ${purchaseId}`

    // Add new items
    for (const item of items) {
      // Add purchase item
      await sql`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
        VALUES (${purchaseId}, ${item.product_id}, ${item.quantity}, ${item.price})
      `

      // Update stock if status is "Received"
      if (status === "Received") {
        await sql`
          UPDATE products
          SET stock = stock + ${item.quantity}
          WHERE id = ${item.product_id}
        `
      }
    }

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return { success: true, message: "Purchase updated successfully", data: purchaseResult[0] }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Update purchase error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function updatePurchaseStatus(purchaseId: number, status: string) {
  if (!purchaseId || !status) {
    return { success: false, message: "Purchase ID and status are required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Get the current status
    const currentStatus = await sql`
      SELECT status FROM purchases WHERE id = ${purchaseId}
    `

    if (currentStatus.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Purchase not found" }
    }

    const oldStatus = currentStatus[0].status

    // Update the status
    const result = await sql`
      UPDATE purchases
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${purchaseId}
      RETURNING *
    `

    if (result.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Failed to update purchase status" }
    }

    // If changing from non-received to received, update stock
    if (oldStatus !== "Received" && status === "Received") {
      const purchaseItems = await sql`
        SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ${purchaseId}
      `

      for (const item of purchaseItems) {
        await sql`
          UPDATE products
          SET stock = stock + ${item.quantity}
          WHERE id = ${item.product_id}
        `
      }
    }

    // If changing from received to non-received, decrease stock
    if (oldStatus === "Received" && status !== "Received") {
      const purchaseItems = await sql`
        SELECT pi.product_id, pi.quantity, p.stock
        FROM purchase_items pi
        JOIN products p ON pi.product_id = p.id
        WHERE pi.purchase_id = ${purchaseId}
      `

      for (const item of purchaseItems) {
        if (item.stock < item.quantity) {
          await sql`ROLLBACK`
          return { success: false, message: `Insufficient stock for product ID ${item.product_id}` }
        }

        await sql`
          UPDATE products
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.product_id}
        `
      }
    }

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return { success: true, message: "Purchase status updated successfully", data: result[0] }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Update purchase status error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function deletePurchase(purchaseId: number) {
  if (!purchaseId) {
    return { success: false, message: "Purchase ID is required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Check if the purchase is received
    const purchase = await sql`
      SELECT status FROM purchases WHERE id = ${purchaseId}
    `

    if (purchase.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Purchase not found" }
    }

    // If the purchase is received, check and update stock
    if (purchase[0].status === "Received") {
      const purchaseItems = await sql`
        SELECT pi.product_id, pi.quantity, p.stock
        FROM purchase_items pi
        JOIN products p ON pi.product_id = p.id
        WHERE pi.purchase_id = ${purchaseId}
      `

      for (const item of purchaseItems) {
        if (item.stock < item.quantity) {
          await sql`ROLLBACK`
          return { success: false, message: `Cannot delete: Insufficient stock for product ID ${item.product_id}` }
        }

        await sql`
          UPDATE products
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.product_id}
        `
      }
    }

    // Delete purchase items
    await sql`DELETE FROM purchase_items WHERE purchase_id = ${purchaseId}`

    // Delete the purchase
    const result = await sql`DELETE FROM purchases WHERE id = ${purchaseId} RETURNING id`

    if (result.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Failed to delete purchase" }
    }

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return { success: true, message: "Purchase deleted successfully" }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Delete purchase error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

