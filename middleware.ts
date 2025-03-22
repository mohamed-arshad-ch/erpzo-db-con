import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/"

  // Get the token from the cookies
  const token = request.cookies.get("auth_token")?.value || ""

  // Redirect to login if accessing a protected route without a token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Redirect to dashboard if accessing login page with a token
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/", "/dashboard/:path*"],
}

