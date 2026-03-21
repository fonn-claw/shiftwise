import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, employeeRoles, availability } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export type EmployeeWithRoles = {
  id: number
  email: string
  passwordHash: string
  name: string
  role: "manager" | "supervisor" | "employee"
  hourlyRate: string
  maxHoursPerWeek: number
  phone: string | null
  storeId: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  jobRoles: { id: number; userId: number; roleName: "cashier" | "stock" | "manager" | "visual_merch" }[]
  availability: { id: number; userId: number; dayOfWeek: number; isAvailable: boolean }[]
}

export async function getEmployees(): Promise<EmployeeWithRoles[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  if (session.user.role === "employee") {
    const userData = await db.select().from(users).where(eq(users.id, parseInt(session.user.id)))
    const rolesData = await db.select().from(employeeRoles).where(eq(employeeRoles.userId, parseInt(session.user.id)))
    const availData = await db.select().from(availability).where(eq(availability.userId, parseInt(session.user.id)))
    return userData.map((u) => ({
      ...u,
      jobRoles: rolesData,
      availability: availData,
    }))
  }

  const allUsers = await db.select().from(users)
  const allRoles = await db.select().from(employeeRoles)
  const allAvail = await db.select().from(availability)

  return allUsers.map((u) => ({
    ...u,
    jobRoles: allRoles.filter((r) => r.userId === u.id),
    availability: allAvail.filter((a) => a.userId === u.id),
  }))
}

export async function getEmployeeById(id: number): Promise<EmployeeWithRoles | null> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  if (session.user.role === "employee" && parseInt(session.user.id) !== id) {
    throw new Error("Unauthorized")
  }

  const [user] = await db.select().from(users).where(eq(users.id, id))
  if (!user) return null

  const roles = await db.select().from(employeeRoles).where(eq(employeeRoles.userId, id))
  const avail = await db.select().from(availability).where(eq(availability.userId, id))

  return { ...user, jobRoles: roles, availability: avail }
}
