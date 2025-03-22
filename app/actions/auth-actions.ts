"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

// Generate a secure token without using crypto module
function generateToken(): string {
  // Generate a random string using Math.random and current timestamp
  const randomPart = Math.random().toString(36).substring(2, 15)
  const timestampPart = Date.now().toString(36)
  const secondRandomPart = Math.random().toString(36).substring(2, 15)

  // Combine parts to create a reasonably secure token
  return `${randomPart}_${timestampPart}_${secondRandomPart}`
}

// Simple password hashing (in a real app, use bcrypt or similar)
function hashPassword(password: string): string {
  // This is a placeholder - in a real app, use a proper hashing library
  return password + "_hashed"
}

export async function signUp(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm-password") as string

  if (!name || !email || !password) {
    return { success: false, message: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Check if user already exists
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`

    if (existingUser.length > 0) {
      return { success: false, message: "User with this email already exists" }
    }

    // Generate token
    const token = generateToken()

    // Create new user with token
    const passwordHash = hashPassword(password)
    const result = await sql`
      INSERT INTO users (name, email, password_hash, auth_token)
      VALUES (${name}, ${email}, ${passwordHash}, ${token})
      RETURNING id, name, email, auth_token
    `

    if (result.length > 0) {
      // Set a session cookie
      cookies().set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      // Return user data and token for client-side storage
      return {
        success: true,
        message: "Account created successfully",
        userData: {
          id: result[0].id,
          name: result[0].name,
          email: result[0].email,
          token: result[0].auth_token,
        },
      }
    }

    return { success: false, message: "Failed to create account" }
  } catch (error) {
    console.error("Signup error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, message: "Email and password are required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // In a real app, you would verify the password hash
    const passwordHash = hashPassword(password)
    const result = await sql`
      SELECT id, name, email, auth_token FROM users 
      WHERE email = ${email} AND password_hash = ${passwordHash}
    `

    if (result.length > 0) {
      // If token doesn't exist, generate a new one
      let token = result[0].auth_token

      if (!token) {
        token = generateToken()
        // Update the user with the new token
        await sql`
          UPDATE users
          SET auth_token = ${token}
          WHERE id = ${result[0].id}
        `
      }

      // Set a session cookie
      cookies().set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      // Return user data and token for client-side storage
      return {
        success: true,
        message: "Login successful",
        redirect: "/dashboard",
        userData: {
          id: result[0].id,
          name: result[0].name,
          email: result[0].email,
          token: token,
        },
      }
    }

    return { success: false, message: "Invalid email or password" }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get("reset-email") as string

  if (!email) {
    return { success: false, message: "Email is required" }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Check if user exists
    const user = await sql`SELECT * FROM users WHERE email = ${email}`

    if (user.length === 0) {
      // Don't reveal that the user doesn't exist for security reasons
      return { success: true, message: "If your email is registered, you will receive a password reset link" }
    }

    // In a real app, you would send an email with a reset link
    // For now, we'll just return a success message

    return { success: true, message: "If your email is registered, you will receive a password reset link" }
  } catch (error) {
    console.error("Forgot password error:", error)
    // Even on error, don't reveal if the email exists
    return { success: true, message: "If your email is registered, you will receive a password reset link" }
  }
}

export async function logout() {
  cookies().delete("auth_token")
  redirect("/")
}

export async function getCurrentUser() {
  const authToken = cookies().get("auth_token")?.value

  if (!authToken) {
    return null
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const result = await sql`
      SELECT id, name, email FROM users WHERE auth_token = ${authToken}
    `

    if (result.length > 0) {
      return result[0]
    }

    return null
  } catch (error) {
    console.error("Get current user error:", error)
    // If we can't connect to the database, check localStorage in the client component
    return null
  }
}

// Verify token validity
export async function verifyToken(token: string) {
  if (!token) {
    return false
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const result = await sql`
      SELECT id FROM users WHERE auth_token = ${token}
    `

    return result.length > 0
  } catch (error) {
    console.error("Verify token error:", error)
    return false
  }
}

