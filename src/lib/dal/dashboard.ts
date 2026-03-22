import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { shifts, users, stores } from "@/lib/db/schema"
import { and, eq, gte, lte, isNotNull } from "drizzle-orm"
import {
  startOfWeek,
  endOfWeek,
  format,
  addWeeks,
} from "date-fns"
import { calculateShiftHours } from "@/lib/utils/cost-calculator"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TodayShift = {
  id: number
  employeeId: number
  employeeName: string
  roleName: "cashier" | "stock" | "manager" | "visual_merch"
  startTime: string
  endTime: string
  status: "working" | "upcoming" | "completed"
}

export type EmployeeWeekSummary = {
  employeeId: number
  employeeName: string
  totalHours: number
  maxHours: number
  hourlyRate: number
  overtimeLevel: "none" | "amber" | "red"
}

export type WeekCostPoint = {
  weekLabel: string
  totalCost: number
  totalHours: number
  budget: number
}

export type DashboardData = {
  todayShifts: TodayShift[]
  weekSummary: EmployeeWeekSummary[]
  historicalCosts: WeekCostPoint[]
  storeName: string
  weeklyBudget: number
  todayDate: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireManagerOrSupervisor() {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")
  if (session.user.role === "employee") throw new Error("Not authorized")
  return session
}

function shiftStatus(
  shiftDate: string,
  startTime: string,
  endTime: string,
  now: Date
): "working" | "upcoming" | "completed" {
  const today = format(now, "yyyy-MM-dd")
  if (shiftDate !== today) return "upcoming"

  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  const shiftStart = new Date(now)
  shiftStart.setHours(sh, sm, 0, 0)
  const shiftEnd = new Date(now)
  shiftEnd.setHours(eh, em, 0, 0)

  if (now < shiftStart) return "upcoming"
  if (now > shiftEnd) return "completed"
  return "working"
}

// ---------------------------------------------------------------------------
// getDashboardData
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<DashboardData> {
  await requireManagerOrSupervisor()

  const now = new Date()
  const todayStr = format(now, "yyyy-MM-dd")
  const currentMonday = startOfWeek(now, { weekStartsOn: 1 })
  const currentSunday = endOfWeek(now, { weekStartsOn: 1 })
  const mondayStr = format(currentMonday, "yyyy-MM-dd")
  const sundayStr = format(currentSunday, "yyyy-MM-dd")

  // Fetch store, employees, today's shifts, and current week's shifts in parallel
  const [allStores, allEmployees, todayShiftsRaw, weekShiftsRaw] =
    await Promise.all([
      db.select().from(stores),
      db.select().from(users),
      db
        .select({
          id: shifts.id,
          employeeId: shifts.employeeId,
          employeeName: users.name,
          roleName: shifts.roleName,
          startTime: shifts.startTime,
          endTime: shifts.endTime,
        })
        .from(shifts)
        .innerJoin(users, eq(shifts.employeeId, users.id))
        .where(and(eq(shifts.date, todayStr), eq(shifts.status, "assigned"))),
      db
        .select()
        .from(shifts)
        .where(
          and(
            gte(shifts.date, mondayStr),
            lte(shifts.date, sundayStr),
            eq(shifts.status, "assigned"),
            isNotNull(shifts.employeeId)
          )
        ),
    ])

  const store = allStores[0]
  if (!store) throw new Error("No store found")
  const weeklyBudget = Number(store.weeklyBudget)

  const employeeMap = new Map(allEmployees.map((e) => [e.id, e]))

  // Today's shifts with status
  const todayShifts: TodayShift[] = todayShiftsRaw.map((s) => ({
    id: s.id,
    employeeId: s.employeeId!,
    employeeName: s.employeeName,
    roleName: s.roleName,
    startTime: s.startTime,
    endTime: s.endTime,
    status: shiftStatus(todayStr, s.startTime, s.endTime, now),
  }))

  // Sort: working first, then upcoming, then completed
  const statusOrder = { working: 0, upcoming: 1, completed: 2 }
  todayShifts.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  // Week summary per employee
  const hoursMap: Record<number, number> = {}
  for (const s of weekShiftsRaw) {
    if (!s.employeeId) continue
    const hours = calculateShiftHours(s.startTime, s.endTime, s.breakMinutes)
    hoursMap[s.employeeId] = (hoursMap[s.employeeId] || 0) + hours
  }

  const weekSummary: EmployeeWeekSummary[] = Object.entries(hoursMap)
    .map(([id, hours]) => {
      const emp = employeeMap.get(Number(id))
      if (!emp) return null
      return {
        employeeId: Number(id),
        employeeName: emp.name,
        totalHours: hours,
        maxHours: emp.maxHoursPerWeek,
        hourlyRate: Number(emp.hourlyRate),
        overtimeLevel:
          hours >= 40 ? ("red" as const) : hours >= 35 ? ("amber" as const) : ("none" as const),
      }
    })
    .filter((x): x is EmployeeWeekSummary => x !== null)
    .sort((a, b) => b.totalHours - a.totalHours)

  // Historical costs: last 4 weeks
  const historicalCosts: WeekCostPoint[] = []
  for (let i = 3; i >= 0; i--) {
    const weekMonday = addWeeks(currentMonday, -i)
    const weekSunday = endOfWeek(weekMonday, { weekStartsOn: 1 })
    const wMondayStr = format(weekMonday, "yyyy-MM-dd")
    const wSundayStr = format(weekSunday, "yyyy-MM-dd")

    const weekShifts = await db
      .select()
      .from(shifts)
      .where(
        and(
          gte(shifts.date, wMondayStr),
          lte(shifts.date, wSundayStr),
          eq(shifts.status, "assigned"),
          isNotNull(shifts.employeeId)
        )
      )

    let totalCost = 0
    let totalHours = 0
    for (const s of weekShifts) {
      if (!s.employeeId) continue
      const emp = employeeMap.get(s.employeeId)
      if (!emp) continue
      const hours = calculateShiftHours(s.startTime, s.endTime, s.breakMinutes)
      totalHours += hours
      totalCost += hours * Number(emp.hourlyRate)
    }

    historicalCosts.push({
      weekLabel: format(weekMonday, "MMM d"),
      totalCost: Math.round(totalCost * 100) / 100,
      totalHours: Math.round(totalHours * 10) / 10,
      budget: weeklyBudget,
    })
  }

  return {
    todayShifts,
    weekSummary,
    historicalCosts,
    storeName: store.name,
    weeklyBudget,
    todayDate: todayStr,
  }
}
