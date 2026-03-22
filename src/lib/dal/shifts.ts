import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { shifts } from "@/lib/db/schema"
import { and, gte, lte, eq } from "drizzle-orm"
import { startOfWeek, endOfWeek, format } from "date-fns"

export type ShiftRow = {
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

export async function getShiftsForWeek(
  weekStart: Date
): Promise<ShiftRow[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  const monday = startOfWeek(weekStart, { weekStartsOn: 1 })
  const sunday = endOfWeek(weekStart, { weekStartsOn: 1 })
  const mondayStr = format(monday, "yyyy-MM-dd")
  const sundayStr = format(sunday, "yyyy-MM-dd")

  const rows = await db
    .select()
    .from(shifts)
    .where(and(gte(shifts.date, mondayStr), lte(shifts.date, sundayStr)))

  return rows
}

export async function getShiftById(
  id: number
): Promise<ShiftRow | null> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  const [row] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, id))

  return row ?? null
}
