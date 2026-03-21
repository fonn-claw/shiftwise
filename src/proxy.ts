export { auth as proxy } from "@/lib/auth"

export const config = {
  matcher: [
    // Match all routes except auth, static, and API auth routes
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
