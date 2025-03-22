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




const connectionString =
  process.env.NEON_POSTGRES_URL || "postgres://neondb_owner:npg_u3OwIMhxX5aQ@ep-plain-bar-a5xm686a-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

  process.env.DATABASE_URL || "postgres://neondb_owner:npg_u3OwIMhxX5aQ@ep-plain-bar-a5xm686a-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"



// Create a SQL client with error handling
const createSqlClient = () => {

  
  if (!connectionString) {
    console.error("No database URL found in environment variables")
    connectionState.isConnected = false
    connectionState.lastError = new Error("Database URL not configured")
    return {
      sql: async () => {
        throw new Error("Database URL not configured")
      },
    }
  }

  try {
    const sqlFn = neon(connectionString)

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

