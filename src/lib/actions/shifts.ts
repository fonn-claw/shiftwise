"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { shifts } from "@/lib/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { startOfWeek, addDays, format, differenceInDays } from "date-fns"

const createShiftSchema = z.object({
  employeeId: z.number().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  roleName: z.enum(["cashier", "stock", "manager", "visual_merch"]),
  breakMinutes: z.number().int().min(0).max(120).default(0),
})

const updateShiftSchema = createShiftSchema

type ShiftActionResult = {
  success: boolean
  message?: string
  shift?: {
    id: number
    employeeId: number | null
    date: string
    startTime: string
    endTime: string
    roleName: "cashier" | "stock" | "manager" | "visual_merch"
    breakMinutes: number
    status: "assigned" | "open"
    storeId: number
    createdAt: Date
    updatedAt: Date
  }
  count?: number
}

export async function createShift(
  data: z.input<typeof createShiftSchema>
): Promise<ShiftActionResult> {
  const session = await auth()
  if (!session?.user || session.user.role !== "manager") {
    return { success: false, message: "Unauthorized" }
  }

  const parsed = createShiftSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, message: "Invalid shift data" }
  }

  if (parsed.data.endTime <= parsed.data.startTime) {
    return { success: false, message: "End time must be after start time" }
  }

  const [newShift] = await db
    .insert(shifts)
    .values({
      ...parsed.data,
      storeId: 1,
      status: parsed.data.employeeId ? "assigned" : "open",
    })
    .returning()

  revalidatePath("/schedule")
  return { success: true, shift: newShift }
}

export async function updateShift(
  shiftId: number,
  data: z.input<typeof updateShiftSchema>
): Promise<ShiftActionResult> {
  const session = await auth()
  if (!session?.user || session.user.role !== "manager") {
    return { success: false, message: "Unauthorized" }
  }

  const parsed = updateShiftSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, message: "Invalid shift data" }
  }

  if (parsed.data.endTime <= parsed.data.startTime) {
    return { success: false, message: "End time must be after start time" }
  }

  const [updated] = await db
    .update(shifts)
    .set({
      ...parsed.data,
      status: parsed.data.employeeId ? "assigned" : "open",
      updatedAt: new Date(),
    })
    .where(eq(shifts.id, shiftId))
    .returning()

  if (!updated) {
    return { success: false, message: "Shift not found" }
  }

  revalidatePath("/schedule")
  return { success: true, shift: updated }
}

export async function deleteShift(
  shiftId: number
): Promise<ShiftActionResult> {
  const session = await auth()
  if (!session?.user || session.user.role !== "manager") {
    return { success: false, message: "Unauthorized" }
  }

  const [deleted] = await db
    .delete(shifts)
    .where(eq(shifts.id, shiftId))
    .returning()

  if (!deleted) {
    return { success: false, message: "Shift not found" }
  }

  revalidatePath("/schedule")
  return { success: true }
}

export async function moveShift(
  shiftId: number,
  newEmployeeId: number,
  newDate: string
): Promise<ShiftActionResult> {
  const session = await auth()
  if (!session?.user || session.user.role !== "manager") {
    return { success: false, message: "Unauthorized" }
  }

  const [updated] = await db
    .update(shifts)
    .set({
      employeeId: newEmployeeId,
      date: newDate,
      status: "assigned",
      updatedAt: new Date(),
    })
    .where(eq(shifts.id, shiftId))
    .returning()

  if (!updated) {
    return { success: false, message: "Shift not found" }
  }

  revalidatePath("/schedule")
  return { success: true, shift: updated }
}

export async function copyWeekSchedule(
  sourceWeekStart: string,
  targetWeekStart: string
): Promise<ShiftActionResult> {
  const session = await auth()
  if (!session?.user || session.user.role !== "manager") {
    return { success: false, message: "Unauthorized" }
  }

  const sourceMonday = startOfWeek(new Date(sourceWeekStart + "T12:00:00"), {
    weekStartsOn: 1,
  })
  const targetMonday = startOfWeek(new Date(targetWeekStart + "T12:00:00"), {
    weekStartsOn: 1,
  })

  const sourceMondayStr = format(sourceMonday, "yyyy-MM-dd")
  const sourceSundayStr = format(addDays(sourceMonday, 6), "yyyy-MM-dd")

  const sourceShifts = await db
    .select()
    .from(shifts)
    .where(
      and(gte(shifts.date, sourceMondayStr), lte(shifts.date, sourceSundayStr))
    )

  if (sourceShifts.length === 0) {
    return { success: false, message: "No shifts found in source week" }
  }

  const newShifts = sourceShifts.map((shift) => {
    const shiftDate = new Date(shift.date + "T12:00:00")
    const dayOffset = differenceInDays(shiftDate, sourceMonday)
    const newDate = format(addDays(targetMonday, dayOffset), "yyyy-MM-dd")

    return {
      employeeId: shift.employeeId,
      date: newDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      roleName: shift.roleName,
      breakMinutes: shift.breakMinutes,
      status: shift.status,
      storeId: shift.storeId,
    }
  })

  await db.insert(shifts).values(newShifts)

  revalidatePath("/schedule")
  return { success: true, count: newShifts.length }
}
