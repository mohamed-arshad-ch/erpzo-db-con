import { NextResponse } from "next/server"
import { sql, isConnected, getLastError, resetConnectionState } from "@/lib/db"

export async function GET() {
  try {
    // Reset connection state to allow a fresh attempt
    resetConnectionState()

    // Try a simple query to check the connection
    let result
    let success = isConnected()

    if (success) {
      try {
        result = await sql`SELECT 1 as test`
        success = true
      } catch (error) {
        console.error("Database query test failed:", error)
        success = false
        result = { error: error instanceof Error ? error.message : String(error) }
      }
    } else {
      result = { message: "Database connection not initialized" }
    }

    return NextResponse.json(
      {
        success,
        isConnected: isConnected(),
        message: success ? "Database connection successful" : "Database connection failed",
        result,
        lastError: getLastError()?.message,
        env: {
          // List available environment variables (without values)
          vars: Object.keys(process.env).filter(
            (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("PG"),
          ),
        },
      },
      { status: success ? 200 : 500 },
    )
  } catch (error) {
    console.error("Database connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        isConnected: isConnected(),
        message: "Database connection failed",
        error: error instanceof Error ? error.message : String(error),
        lastError: getLastError()?.message,
        env: {
          // List available environment variables (without values)
          vars: Object.keys(process.env).filter(
            (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("PG"),
          ),
        },
      },
      { status: 500 },
    )
  }
}

