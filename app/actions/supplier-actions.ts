"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getSuppliers(userId?: number) {
  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    let suppliers

    if (userId) {
      suppliers = await sql`
        SELECT s.*, COUNT(p.id) as purchase_count
        FROM suppliers s
        LEFT JOIN purchases p ON s.id = p.supplier_id
        WHERE s.created_by = ${userId}
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `
    } else {
      suppliers = await sql`
        SELECT s.*, COUNT(p.id) as purchase_count
        FROM suppliers s
        LEFT JOIN purchases p ON s.id = p.supplier_id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `
    }

    return { success: true, data: suppliers }
  } catch (error) {
    console.error("Get suppliers error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

export async function addSupplier(formData: FormData) {
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
      INSERT INTO suppliers (name, email, phone, address, created_by)
      VALUES (${name}, ${email}, ${phone}, ${address}, ${userId})
      RETURNING *
    `

    if (result.length > 0) {
      revalidatePath("/dashboard")
      return { success: true, message: "Supplier added successfully", data: result[0] }
    }

    return { success: false, message: "Failed to add supplier" }
  } catch (error) {
    console.error("Add supplier error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function updateSupplier(formData: FormData) {
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
        UPDATE suppliers
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
        UPDATE suppliers
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
      return { success: true, message: "Supplier updated successfully", data: result[0] }
    }

    return { success: false, message: "Failed to update supplier" }
  } catch (error) {
    console.error("Update supplier error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function deleteSupplier(id: number) {
  if (!id) {
    return { success: false, message: "Supplier ID is required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Check if supplier has any purchases
    const purchases = await sql`SELECT id FROM purchases WHERE supplier_id = ${id}`

    if (purchases.length > 0) {
      return { success: false, message: "Cannot delete supplier with existing purchases" }
    }

    const result = await sql`DELETE FROM suppliers WHERE id = ${id} RETURNING id`

    if (result.length > 0) {
      revalidatePath("/dashboard")
      return { success: true, message: "Supplier deleted successfully" }
    }

    return { success: false, message: "Failed to delete supplier" }
  } catch (error) {
    console.error("Delete supplier error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

