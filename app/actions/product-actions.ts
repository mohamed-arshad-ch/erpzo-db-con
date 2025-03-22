"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getProducts(userId?: number) {
  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    let products

    if (userId) {
      products = await sql`
      SELECT * FROM products
      WHERE created_by = ${userId}
      ORDER BY created_at DESC
    `
    } else {
      products = await sql`
      SELECT * FROM products
      ORDER BY created_at DESC
    `
    }

    return { success: true, data: products }
  } catch (error) {
    console.error("Get products error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

export async function getProductById(id: number) {
  if (!id) {
    return { success: false, message: "Product ID is required", data: null }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const result = await sql`
      SELECT * FROM products WHERE id = ${id}
    `

    if (result.length === 0) {
      return { success: false, message: "Product not found", data: null }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Get product error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: null,
    }
  }
}

export async function addProduct(formData: FormData) {
  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const description = formData.get("description") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const stock = Number.parseInt(formData.get("stock") as string)
  const userId = Number.parseInt(formData.get("user_id") as string)

  if (!name || isNaN(price)) {
    return { success: false, message: "Name and valid price are required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    const result = await sql`
      INSERT INTO products (name, category, description, price, stock, created_by)
      VALUES (${name}, ${category}, ${description}, ${price}, ${stock || 0}, ${userId})
      RETURNING *
    `

    if (result.length > 0) {
      // If initial stock is greater than 0, add a stock history record
      if (stock > 0) {
        await sql`
          INSERT INTO product_stock_history (
            product_id, quantity, type, reference_type, notes, created_by
          ) VALUES (
            ${result[0].id}, ${stock}, 'adjustment', 'manual', 'Initial stock', ${userId}
          )
        `
      }

      // Commit the transaction
      await sql`COMMIT`

      revalidatePath("/dashboard")
      return { success: true, message: "Product added successfully", data: result[0] }
    }

    await sql`ROLLBACK`
    return { success: false, message: "Failed to add product" }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Add product error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

// Update the updateProduct function to include userId
export async function updateProduct(formData: FormData) {
  const id = Number.parseInt(formData.get("id") as string)
  const name = formData.get("name") as string
  const category = formData.get("category") as string
  const description = formData.get("description") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const stock = Number.parseInt(formData.get("stock") as string)
  const userId = formData.get("user_id") ? Number.parseInt(formData.get("user_id") as string) : undefined

  if (!id || !name || isNaN(price)) {
    return { success: false, message: "ID, name, and valid price are required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Get current product to check if stock has changed
    const currentProduct = await sql`SELECT * FROM products WHERE id = ${id}`

    if (currentProduct.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Product not found" }
    }

    const oldStock = currentProduct[0].stock

    // Update the product - handle userId condition separately to avoid SQL parameter issues
    let result
    if (userId) {
      result = await sql`
        UPDATE products
        SET 
          name = ${name}, 
          category = ${category}, 
          description = ${description}, 
          price = ${price}, 
          stock = ${stock || 0}, 
          updated_at = NOW()
        WHERE id = ${id} AND created_by = ${userId}
        RETURNING *
      `
    } else {
      result = await sql`
        UPDATE products
        SET 
          name = ${name}, 
          category = ${category}, 
          description = ${description}, 
          price = ${price}, 
          stock = ${stock || 0}, 
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    }

    if (result.length > 0) {
      // If stock has changed, add a stock history record
      if (stock !== oldStock) {
        const adjustmentQuantity = stock - oldStock
        const adjustmentType = adjustmentQuantity > 0 ? "increase" : "decrease"

        await sql`
          INSERT INTO product_stock_history (
            product_id, quantity, type, reference_type, notes, created_by
          ) VALUES (
            ${id}, ${Math.abs(adjustmentQuantity)}, ${adjustmentType}, 'manual', 'Stock adjustment from product edit', ${userId || currentProduct[0].created_by}
          )
        `
      }

      // Commit the transaction
      await sql`COMMIT`

      revalidatePath("/dashboard")
      return { success: true, message: "Product updated successfully", data: result[0] }
    }

    await sql`ROLLBACK`
    return { success: false, message: "Failed to update product" }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Update product error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function deleteProduct(id: number) {
  if (!id) {
    return { success: false, message: "Product ID is required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Check if product is used in any sales or purchases
    const saleItems = await sql`SELECT id FROM sale_items WHERE product_id = ${id}`
    const purchaseItems = await sql`SELECT id FROM purchase_items WHERE product_id = ${id}`
    const stockHistory = await sql`SELECT id FROM product_stock_history WHERE product_id = ${id}`

    if (saleItems.length > 0 || purchaseItems.length > 0) {
      return {
        success: false,
        message: "Cannot delete product that has been used in sales or purchases",
      }
    }

    // Start a transaction
    await sql`BEGIN`

    // Delete stock history first (if any)
    if (stockHistory.length > 0) {
      await sql`DELETE FROM product_stock_history WHERE product_id = ${id}`
    }

    // Delete the product
    const result = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`

    if (result.length > 0) {
      // Commit the transaction
      await sql`COMMIT`

      revalidatePath("/dashboard")
      return { success: true, message: "Product deleted successfully" }
    }

    await sql`ROLLBACK`
    return { success: false, message: "Failed to delete product" }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Delete product error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

// Add getProductStockHistory function
export async function getProductStockHistory(productId: number) {
  if (!productId) {
    return { success: false, message: "Product ID is required", data: [] }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Get stock history from the dedicated table
    const history = await sql`
      SELECT 
        id, 
        product_id, 
        quantity, 
        type, 
        reference_id, 
        reference_type, 
        notes, 
        created_at as date
      FROM product_stock_history
      WHERE product_id = ${productId}
      ORDER BY created_at DESC
    `

    return { success: true, data: history }
  } catch (error) {
    console.error("Get product stock history error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

export async function adjustProductStock(formData: FormData) {
  const productId = Number.parseInt(formData.get("product_id") as string)
  const quantity = Number.parseInt(formData.get("quantity") as string)
  const type = formData.get("type") as string // 'increase' or 'decrease'
  const notes = formData.get("notes") as string
  const userId = Number.parseInt(formData.get("user_id") as string)

  if (!productId || isNaN(quantity) || quantity <= 0 || !type) {
    return { success: false, message: "Product ID, valid quantity, and adjustment type are required" }
  }

  if (type !== "increase" && type !== "decrease") {
    return { success: false, message: "Type must be 'increase' or 'decrease'" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Start a transaction
    await sql`BEGIN`

    // Get current product
    const product = await sql`SELECT * FROM products WHERE id = ${productId}`

    if (product.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Product not found" }
    }

    // Calculate new stock
    let newStock
    if (type === "increase") {
      newStock = product[0].stock + quantity
    } else {
      newStock = product[0].stock - quantity

      // Check if we have enough stock
      if (newStock < 0) {
        await sql`ROLLBACK`
        return { success: false, message: "Insufficient stock for adjustment" }
      }
    }

    // Update product stock
    const updatedProduct = await sql`
      UPDATE products
      SET stock = ${newStock}, updated_at = NOW()
      WHERE id = ${productId}
      RETURNING *
    `

    // Add stock history record
    await sql`
      INSERT INTO product_stock_history (
        product_id, quantity, type, reference_type, notes, created_by
      ) VALUES (
        ${productId}, ${quantity}, ${type === "increase" ? "adjustment" : "adjustment"}, 'manual', ${notes || "Manual stock adjustment"}, ${userId}
      )
    `

    // Commit the transaction
    await sql`COMMIT`

    revalidatePath("/dashboard")
    return {
      success: true,
      message: `Stock ${type === "increase" ? "increased" : "decreased"} successfully`,
      data: updatedProduct[0],
    }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("Adjust product stock error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

