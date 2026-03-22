import { describe, it, expect } from "vitest"
import {
  calculateShiftHours,
  calculateWeekCosts,
  type Shift,
  type Employee,
} from "./cost-calculator"

describe("calculateShiftHours", () => {
  it("calculates hours for a 6-hour shift with no break", () => {
    expect(calculateShiftHours("09:00", "15:00", 0)).toBe(6)
  })

  it("calculates hours with a 30-minute break", () => {
    expect(calculateShiftHours("09:00", "15:00", 30)).toBe(5.5)
  })

  it("returns 0 for same start and end time", () => {
    expect(calculateShiftHours("09:00", "09:00", 0)).toBe(0)
  })

  it("returns 0 when break exceeds shift duration", () => {
    expect(calculateShiftHours("09:00", "10:00", 90)).toBe(0)
  })

  it("calculates a full day shift (9-17) with 30-min break", () => {
    expect(calculateShiftHours("09:00", "17:00", 30)).toBe(7.5)
  })

  it("calculates an afternoon shift (15-21) with no break", () => {
    expect(calculateShiftHours("15:00", "21:00", 0)).toBe(6)
  })
})

describe("calculateWeekCosts", () => {
  const employees: Employee[] = [
    { id: 1, hourlyRate: "20.00", name: "Alice" },
    { id: 2, hourlyRate: "15.00", name: "Bob" },
  ]

  const twoShifts: Shift[] = [
    {
      id: 1,
      employeeId: 1,
      date: "2026-03-16",
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier",
      breakMinutes: 0,
      status: "assigned",
    },
    {
      id: 2,
      employeeId: 2,
      date: "2026-03-16",
      startTime: "15:00",
      endTime: "21:00",
      roleName: "stock",
      breakMinutes: 0,
      status: "assigned",
    },
  ]

  it("returns correct totalHours for 2 shifts", () => {
    const result = calculateWeekCosts(twoShifts, employees, 12000)
    expect(result.totalHours).toBe(12) // 6 + 6
  })

  it("returns correct totalCost for 2 shifts", () => {
    const result = calculateWeekCosts(twoShifts, employees, 12000)
    // Alice: 6h * $20 = $120, Bob: 6h * $15 = $90
    expect(result.totalCost).toBe(210)
  })

  it("returns correct budgetPercent", () => {
    const result = calculateWeekCosts(twoShifts, employees, 12000)
    expect(result.budgetPercent).toBeCloseTo(1.75, 2) // 210/12000 * 100
  })

  it("returns correct dailyCosts keyed by date string", () => {
    const result = calculateWeekCosts(twoShifts, employees, 12000)
    expect(result.dailyCosts["2026-03-16"]).toBe(210) // 120 + 90
  })

  it("returns correct dailyHours keyed by date string", () => {
    const result = calculateWeekCosts(twoShifts, employees, 12000)
    expect(result.dailyHours["2026-03-16"]).toBe(12)
  })

  it("returns amber overtime alert for employee at 36 hours", () => {
    const manyShifts: Shift[] = []
    // 6 shifts of 6 hours each = 36 hours for employee 1
    for (let i = 0; i < 6; i++) {
      manyShifts.push({
        id: i + 10,
        employeeId: 1,
        date: `2026-03-${16 + i}`,
        startTime: "09:00",
        endTime: "15:00",
        roleName: "cashier",
        breakMinutes: 0,
        status: "assigned",
      })
    }
    const result = calculateWeekCosts(manyShifts, employees, 12000)
    expect(result.employeeHours[1]).toBe(36)
    const alert = result.overtimeAlerts.find((a) => a.employeeId === 1)
    expect(alert).toBeDefined()
    expect(alert!.level).toBe("amber")
    expect(alert!.hours).toBe(36)
  })

  it("returns red overtime alert for employee at 41 hours", () => {
    const manyShifts: Shift[] = []
    // 5 shifts of 8h + 1 shift of 1h = 41 hours
    for (let i = 0; i < 5; i++) {
      manyShifts.push({
        id: i + 20,
        employeeId: 1,
        date: `2026-03-${16 + i}`,
        startTime: "09:00",
        endTime: "17:00",
        roleName: "cashier",
        breakMinutes: 0,
        status: "assigned",
      })
    }
    manyShifts.push({
      id: 25,
      employeeId: 1,
      date: "2026-03-21",
      startTime: "09:00",
      endTime: "10:00",
      roleName: "cashier",
      breakMinutes: 0,
      status: "assigned",
    })
    const result = calculateWeekCosts(manyShifts, employees, 12000)
    expect(result.employeeHours[1]).toBe(41)
    const alert = result.overtimeAlerts.find((a) => a.employeeId === 1)
    expect(alert).toBeDefined()
    expect(alert!.level).toBe("red")
  })

  it("skips shifts with null employeeId (open shifts)", () => {
    const shiftsWithOpen: Shift[] = [
      ...twoShifts,
      {
        id: 3,
        employeeId: null,
        date: "2026-03-17",
        startTime: "15:00",
        endTime: "21:00",
        roleName: "cashier",
        breakMinutes: 0,
        status: "open",
      },
    ]
    const result = calculateWeekCosts(shiftsWithOpen, employees, 12000)
    // Open shift should not affect totals
    expect(result.totalHours).toBe(12)
    expect(result.totalCost).toBe(210)
  })

  it("returns 0 budgetPercent when budget is 0", () => {
    const result = calculateWeekCosts(twoShifts, employees, 0)
    expect(result.budgetPercent).toBe(0)
  })

  it("handles empty shifts array", () => {
    const result = calculateWeekCosts([], employees, 12000)
    expect(result.totalHours).toBe(0)
    expect(result.totalCost).toBe(0)
    expect(result.budgetPercent).toBe(0)
    expect(result.overtimeAlerts).toHaveLength(0)
  })
})
