import { auth } from "@/lib/auth"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")
  return session
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth()
  if (!roles.includes(session.user.role)) throw new Error("Unauthorized")
  return session
}
