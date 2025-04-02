import { neon, neonConfig } from "@neondatabase/serverless"

// Configure Neon with longer timeouts
neonConfig.fetchConnectionCache = true
neonConfig.fetchTimeout = 15000 // 15 seconds

// Global connection state
const connectionState = {
  isConnected: false,
  lastError: null as Error | null,
  lastAttempt: 0,
  connectionAttempts: 0,
}

// Try to get the database URL from environment variables
const getDatabaseUrl = () => {
  // First try the NEON_NEON_DATABASE_URL which is the most reliable one
 

  return "postgres://neondb_owner:npg_gVSuX0Pi6jyB@ep-icy-tree-a1m05jjz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
}

// Create a SQL client with error handling
const createSqlClient = () => {
  const dbUrl = getDatabaseUrl()

  if (!dbUrl) {
    console.error("No database URL found in environment variables")
    connectionState.isConnected = false
    connectionState.lastError = new Error("Database URL not configured")
    return {
      sql: async () => {
        throw new Error("Database URL not configured. Please check your environment variables.")
      },
    }
  }

  try {
    const sqlFn = neon(dbUrl)

    // Create a wrapped version that handles errors
    const wrappedSql = async (...args: Parameters<typeof sqlFn>) => {
      try {
        // Only attempt a new connection if the last attempt was more than 5 seconds ago
        // or if this is one of the first 3 attempts
        const now = Date.now()
        if (
          !connectionState.isConnected &&
          now - connectionState.lastAttempt < 5000 &&
          connectionState.connectionAttempts > 3
        ) {
          throw connectionState.lastError || new Error("Database connection failed")
        }

        connectionState.lastAttempt = now
        connectionState.connectionAttempts++
        const result = await sqlFn(...args)
        connectionState.isConnected = true
        return result
      } catch (error) {
        connectionState.isConnected = false
        connectionState.lastError = error instanceof Error ? error : new Error(String(error))

        // Check for authentication errors specifically
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes("authentication failed") || errorMessage.includes("password authentication failed")) {
          console.error("Database authentication error:", errorMessage)
          throw new Error(
            "Database authentication failed. Please check your database credentials in the environment variables.",
          )
        }

        console.error("Database query error:", error)
        throw new Error(`Database query failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Test the connection
    ;(async () => {
      try {
        await wrappedSql`SELECT 1`
        connectionState.isConnected = true
        console.log("Database connection successful")
      } catch (error) {
        connectionState.isConnected = false
        connectionState.lastError = error instanceof Error ? error : new Error(String(error))
        console.error("Initial database connection test failed:", error)
      }
    })()

    return {
      sql: wrappedSql,
    }
  } catch (error) {
    console.error("Error initializing database connection:", error)
    connectionState.isConnected = false
    connectionState.lastError = error instanceof Error ? error : new Error(String(error))

    return {
      sql: async () => {
        throw new Error("Database connection failed")
      },
    }
  }
}

// Initialize the client
const { sql } = createSqlClient()

// Helper function to format date for display
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Check if database is connected
function isConnected(): boolean {
  return connectionState.isConnected
}

// Get the last database error
function getLastError(): Error | null {
  return connectionState.lastError
}

// Reset connection state
function resetConnectionState() {
  connectionState.connectionAttempts = 0
  connectionState.lastAttempt = 0
}



export { sql, isConnected, getLastError, formatDate, resetConnectionState }

