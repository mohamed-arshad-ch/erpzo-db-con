"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getCustomers(userId?: number) {
  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    let customers

    if (userId) {
      customers = await sql`
      SELECT c.*, COUNT(s.id) as order_count
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      WHERE c.created_by = ${userId}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `
    } else {
      customers = await sql`
      SELECT c.*, COUNT(s.id) as order_count
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `
    }

    return { success: true, data: customers }
  } catch (error) {
    console.error("Get customers error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

export async function addCustomer(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const userId = Number.parseInt(formData.get("user_id") as string)

  if (!name) {
    return { success: false, message: "Name is required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const result = await sql`
    INSERT INTO customers (name, email, phone, address, created_by)
    VALUES (${name}, ${email}, ${phone}, ${address}, ${userId})
    RETURNING *
  `

    if (result.length > 0) {
      revalidatePath("/dashboard")
      return { success: true, message: "Customer added successfully", data: result[0] }
    }

    return { success: false, message: "Failed to add customer" }
  } catch (error) {
    console.error("Add customer error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

// Update the updateCustomer function to include userId
export async function updateCustomer(formData: FormData) {
  const id = Number.parseInt(formData.get("id") as string)
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const userId = formData.get("user_id") ? Number.parseInt(formData.get("user_id") as string) : undefined

  if (!id || !name) {
    return { success: false, message: "ID and name are required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Handle userId condition separately to avoid SQL parameter issues
    let result
    if (userId) {
      result = await sql`
        UPDATE customers
        SET 
          name = ${name}, 
          email = ${email}, 
          phone = ${phone}, 
          address = ${address}, 
          updated_at = NOW()
        WHERE id = ${id} AND created_by = ${userId}
        RETURNING *
      `
    } else {
      result = await sql`
        UPDATE customers
        SET 
          name = ${name}, 
          email = ${email}, 
          phone = ${phone}, 
          address = ${address}, 
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    }

    if (result.length > 0) {
      revalidatePath("/dashboard")
      return { success: true, message: "Customer updated successfully", data: result[0] }
    }

    return { success: false, message: "Failed to update customer" }
  } catch (error) {
    console.error("Update customer error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function deleteCustomer(id: number) {
  if (!id) {
    return { success: false, message: "Customer ID is required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Check if customer has any sales
    const sales = await sql`SELECT id FROM sales WHERE customer_id = ${id}`

    if (sales.length > 0) {
      return { success: false, message: "Cannot delete customer with existing sales" }
    }

    const result = await sql`DELETE FROM customers WHERE id = ${id} RETURNING id`

    if (result.length > 0) {
      revalidatePath("/dashboard")
      return { success: true, message: "Customer deleted successfully" }
    }

    return { success: false, message: "Failed to delete customer" }
  } catch (error) {
    console.error("Delete customer error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

