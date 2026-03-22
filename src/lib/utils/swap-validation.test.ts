import { describe, it, expect } from "vitest"
import { validateSwapHours, type ShiftForValidation } from "./swap-validation"

function makeShift(
  overrides: Partial<ShiftForValidation> = {}
): ShiftForValidation {
  return {
    id: 1,
    employeeId: 1,
    startTime: "09:00",
    endTime: "15:00",
    breakMinutes: 0,
    date: "2026-03-23",
    ...overrides,
  }
}

describe("validateSwapHours", () => {
  it("rejects swap when requestor would exceed 40 hours", () => {
    // Requestor has 42h, gives away 4h shift, gains 8h shift = 46h (exceeds 40h)
    const requestorShifts = [
      makeShift({ id: 1, employeeId: 1, startTime: "09:00", endTime: "17:00", date: "2026-03-23" }),
      makeShift({ id: 2, employeeId: 1, startTime: "09:00", endTime: "17:00", date: "2026-03-24" }),
      makeShift({ id: 3, employeeId: 1, startTime: "09:00", endTime: "17:00", date: "2026-03-25" }),
      makeShift({ id: 4, employeeId: 1, startTime: "09:00", endTime: "17:00", date: "2026-03-26" }),
      makeShift({ id: 5, employeeId: 1, startTime: "09:00", endTime: "15:00", date: "2026-03-27" }),
      makeShift({ id: 6, employeeId: 1, startTime: "09:00", endTime: "13:00", date: "2026-03-28" }),
    ]
    // Total = 8+8+8+8+6+4 = 42h, give away shift 6 (4h), gain 8h = 42-4+8 = 46h

    const requestorSwapShift = makeShift({ id: 6, employeeId: 1, startTime: "09:00", endTime: "13:00", date: "2026-03-28" })
    const targetSwapShift = makeShift({ id: 100, employeeId: 2, startTime: "09:00", endTime: "17:00", date: "2026-03-29" })
    const targetShifts = [
      targetSwapShift,
    ]

    const result = validateSwapHours({
      requestorCurrentShifts: requestorShifts,
      targetCurrentShifts: targetShifts,
      requestorSwapShift,
      targetSwapShift,
      requestorName: "Ana",
      targetName: "Carlos",
    })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain("Ana")
      expect(result.reason).toContain("46")
      expect(result.reason).toContain("40")
    }
  })

  it("approves swap when both employees stay under 40 hours", () => {
    const requestorShifts = [
      makeShift({ id: 1, employeeId: 1, startTime: "09:00", endTime: "15:00", date: "2026-03-23" }),
      makeShift({ id: 2, employeeId: 1, startTime: "09:00", endTime: "15:00", date: "2026-03-24" }),
    ]
    // Requestor total = 12h, give away shift 1 (6h), gain 6h = 12h

    const requestorSwapShift = makeShift({ id: 1, employeeId: 1, startTime: "09:00", endTime: "15:00", date: "2026-03-23" })

    const targetSwapShift = makeShift({ id: 10, employeeId: 2, startTime: "15:00", endTime: "21:00", date: "2026-03-23" })
    const targetShifts = [
      targetSwapShift,
      makeShift({ id: 11, employeeId: 2, startTime: "09:00", endTime: "15:00", date: "2026-03-24" }),
    ]
    // Target total = 12h, give away shift 10 (6h), gain 6h = 12h

    const result = validateSwapHours({
      requestorCurrentShifts: requestorShifts,
      targetCurrentShifts: targetShifts,
      requestorSwapShift,
      targetSwapShift,
      requestorName: "Ana",
      targetName: "Carlos",
    })

    expect(result.valid).toBe(true)
  })

  it("rejects swap when target would exceed max hours", () => {
    const targetShifts = [
      makeShift({ id: 10, employeeId: 2, startTime: "09:00", endTime: "17:00", date: "2026-03-23" }),
      makeShift({ id: 11, employeeId: 2, startTime: "09:00", endTime: "17:00", date: "2026-03-24" }),
      makeShift({ id: 12, employeeId: 2, startTime: "09:00", endTime: "17:00", date: "2026-03-25" }),
      makeShift({ id: 13, employeeId: 2, startTime: "09:00", endTime: "17:00", date: "2026-03-26" }),
      makeShift({ id: 14, employeeId: 2, startTime: "09:00", endTime: "15:00", date: "2026-03-27" }),
    ]
    // Target total = 38h, give away 4h shift, gain 8h = 42h
    const targetSwapShift = makeShift({ id: 14, employeeId: 2, startTime: "09:00", endTime: "13:00", date: "2026-03-27" })

    const requestorSwapShift = makeShift({ id: 1, employeeId: 1, startTime: "09:00", endTime: "17:00", date: "2026-03-28" })
    const requestorShifts = [requestorSwapShift]

    const result = validateSwapHours({
      requestorCurrentShifts: requestorShifts,
      targetCurrentShifts: targetShifts,
      requestorSwapShift,
      targetSwapShift,
      requestorName: "Ana",
      targetName: "Carlos",
    })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain("Carlos")
    }
  })

  it("respects custom maxHours parameter", () => {
    const requestorShifts = [
      makeShift({ id: 1, employeeId: 1, startTime: "09:00", endTime: "15:00", date: "2026-03-23" }),
      makeShift({ id: 2, employeeId: 1, startTime: "09:00", endTime: "15:00", date: "2026-03-24" }),
      makeShift({ id: 3, employeeId: 1, startTime: "09:00", endTime: "15:00", date: "2026-03-25" }),
    ]
    // 18h total, give away 6h (shift 1), gain 8h = 20h
    const requestorSwapShift = makeShift({ id: 1, employeeId: 1, startTime: "09:00", endTime: "15:00", date: "2026-03-23" })
    const targetSwapShift = makeShift({ id: 10, employeeId: 2, startTime: "09:00", endTime: "17:00", date: "2026-03-28" })
    const targetShifts = [targetSwapShift]

    // With maxHours=15, requestor's 20h exceeds limit
    const result = validateSwapHours({
      requestorCurrentShifts: requestorShifts,
      targetCurrentShifts: targetShifts,
      requestorSwapShift,
      targetSwapShift,
      requestorName: "Ana",
      targetName: "Carlos",
      maxHours: 15,
    })

    expect(result.valid).toBe(false)
  })
})
