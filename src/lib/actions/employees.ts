"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, employeeRoles, availability } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["manager", "supervisor", "employee"]),
  hourlyRate: z.coerce.number().positive("Rate must be positive"),
  maxHoursPerWeek: z.coerce.number().int().min(1).max(60),
  phone: z.string().optional(),
  jobRoles: z.array(z.enum(["cashier", "stock", "manager", "visual_merch"])).min(1, "At least one job role required"),
})

const updateEmployeeSchema = createEmployeeSchema.extend({
  id: z.coerce.number(),
})

export type ActionResult = {
  success: boolean
  employeeId?: number
  errors?: Record<string, string[]>
  message?: string
}

export async function createEmployee(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user || session.user.role !== "manager") {
    return { success: false, message: "Unauthorized" }
  }

  const jobRolesRaw = formData.getAll("jobRoles") as string[]

  const parsed = createEmployeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    hourlyRate: formData.get("hourlyRate"),
    maxHoursPerWeek: formData.get("maxHoursPerWeek"),
    phone: formData.get("phone") || undefined,
    jobRoles: jobRolesRaw,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0])
      if (!fieldErrors[field]) fieldErrors[field] = []
      fieldErrors[field].push(issue.message)
    }
    return { success: false, errors: fieldErrors }
  }

  const { name, email, role, hourlyRate, maxHoursPerWeek, phone, jobRoles } = parsed.data

  const passwordHash = await bcrypt.hash("changeme123", 10)

  let newUser: { id: number }
  try {
    const [inserted] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role,
        hourlyRate: String(hourlyRate),
        maxHoursPerWeek,
        phone: phone ?? null,
        storeId: 1,
      })
      .returning({ id: users.id })
    newUser = inserted
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("violates")) {
      return { success: false, errors: { email: ["An employee with this email already exists"] } }
    }
    return { success: false, message: "Failed to create employee" }
  }

  // Insert job roles
  for (const roleName of jobRoles) {
    await db.insert(employeeRoles).values({
      userId: newUser.id,
      roleName,
    })
  }

  // Insert default availability (all days available)
  for (let day = 0; day < 7; day++) {
    await db.insert(availability).values({
      userId: newUser.id,
      dayOfWeek: day,
      isAvailable: true,
    })
  }

  revalidatePath("/employees")
  return { success: true, employeeId: newUser.id }
}

export async function updateEmployee(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user || session.user.role !== "manager") {
    return { success: false, message: "Unauthorized" }
  }

  const jobRolesRaw = formData.getAll("jobRoles") as string[]

  const parsed = updateEmployeeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    hourlyRate: formData.get("hourlyRate"),
    maxHoursPerWeek: formData.get("maxHoursPerWeek"),
    phone: formData.get("phone") || undefined,
    jobRoles: jobRolesRaw,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0])
      if (!fieldErrors[field]) fieldErrors[field] = []
      fieldErrors[field].push(issue.message)
    }
    return { success: false, errors: fieldErrors }
  }

  const { id, name, email, role, hourlyRate, maxHoursPerWeek, phone, jobRoles } = parsed.data

  try {
    await db
      .update(users)
      .set({
        name,
        email,
        role,
        hourlyRate: String(hourlyRate),
        maxHoursPerWeek,
        phone: phone ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))

    // Replace job roles
    await db.delete(employeeRoles).where(eq(employeeRoles.userId, id))
    for (const roleName of jobRoles) {
      await db.insert(employeeRoles).values({
        userId: id,
        roleName,
      })
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("violates")) {
      return { success: false, errors: { email: ["An employee with this email already exists"] } }
    }
    return { success: false, message: "Failed to update employee" }
  }

  revalidatePath("/employees")
  return { success: true }
}

export async function updateAvailability(
  userId: number,
  dayOfWeek: number,
  isAvailable: boolean
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, message: "Not authenticated" }
  }

  // Employee can only update their own availability
  if (session.user.role === "employee" && parseInt(session.user.id) !== userId) {
    return { success: false, message: "Unauthorized" }
  }

  // Only managers and the employee themselves can update
  if (session.user.role !== "manager" && parseInt(session.user.id) !== userId) {
    return { success: false, message: "Unauthorized" }
  }

  // Delete existing record then insert (upsert pattern)
  await db
    .delete(availability)
    .where(and(eq(availability.userId, userId), eq(availability.dayOfWeek, dayOfWeek)))

  await db.insert(availability).values({
    userId,
    dayOfWeek,
    isAvailable,
  })

  revalidatePath("/employees")
  return { success: true }
}
