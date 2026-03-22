/**
 * Pure cost calculation functions for the schedule builder.
 * No server-side imports — safe for client-side use.
 */

export type Shift = {
  id: number
  employeeId: number | null
  date: string
  startTime: string
  endTime: string
  roleName: string
  breakMinutes: number
  status: string
}

export type Employee = {
  id: number
  hourlyRate: string
  name: string
}

export interface CostSummary {
  totalHours: number
  totalCost: number
  budgetPercent: number
  dailyCosts: Record<string, number>
  dailyHours: Record<string, number>
  employeeHours: Record<number, number>
  overtimeAlerts: {
    employeeId: number
    hours: number
    level: "amber" | "red"
  }[]
}

export function calculateShiftHours(
  startTime: string,
  endTime: string,
  breakMinutes: number
): number {
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  const totalMinutes = eh * 60 + em - (sh * 60 + sm) - breakMinutes
  return Math.max(0, totalMinutes / 60)
}

export function calculateWeekCosts(
  shifts: Shift[],
  employees: Employee[],
  weeklyBudget: number
): CostSummary {
  const employeeMap = new Map(employees.map((e) => [e.id, e]))
  const employeeHours: Record<number, number> = {}
  const dailyCosts: Record<string, number> = {}
  const dailyHours: Record<string, number> = {}
  let totalCost = 0
  let totalHours = 0

  for (const shift of shifts) {
    if (shift.employeeId == null) continue // skip open shifts
    const employee = employeeMap.get(shift.employeeId)
    if (!employee) continue

    const hours = calculateShiftHours(
      shift.startTime,
      shift.endTime,
      shift.breakMinutes
    )
    const rate = Number(employee.hourlyRate)
    const cost = hours * rate

    totalHours += hours
    totalCost += cost
    employeeHours[shift.employeeId] =
      (employeeHours[shift.employeeId] || 0) + hours
    dailyCosts[shift.date] = (dailyCosts[shift.date] || 0) + cost
    dailyHours[shift.date] = (dailyHours[shift.date] || 0) + hours
  }

  const overtimeAlerts = Object.entries(employeeHours)
    .filter(([, hours]) => hours >= 35)
    .map(([id, hours]) => ({
      employeeId: Number(id),
      hours,
      level: (hours >= 40 ? "red" : "amber") as "amber" | "red",
    }))

  return {
    totalHours,
    totalCost,
    budgetPercent:
      weeklyBudget > 0 ? (totalCost / weeklyBudget) * 100 : 0,
    dailyCosts,
    dailyHours,
    employeeHours,
    overtimeAlerts,
  }
}
