import { describe, it, expect } from "vitest"
import {
  calculatePremiumPay,
  checkNoticePeriod,
  DEFAULT_COMPLIANCE_RULES,
} from "./compliance-rules"

describe("calculatePremiumPay", () => {
  it("returns 2-hour premium for changes within 24 hours", () => {
    const result = calculatePremiumPay(23, 17)
    expect(result).not.toBeNull()
    expect(result!.premiumHours).toBe(2)
    expect(result!.premiumCost).toBe(34) // 2 * 17
    expect(result!.rule).toContain("24 hours")
  })

  it("returns 4-hour premium for changes within 72 hours", () => {
    const result = calculatePremiumPay(48, 17)
    expect(result).not.toBeNull()
    expect(result!.premiumHours).toBe(4)
    expect(result!.premiumCost).toBe(68) // 4 * 17
    expect(result!.rule).toContain("72 hours")
  })

  it("returns null for changes beyond 72 hours", () => {
    const result = calculatePremiumPay(100, 17)
    expect(result).toBeNull()
  })

  it("uses smallest matching window (24h beats 72h)", () => {
    const result = calculatePremiumPay(12, 20)
    expect(result).not.toBeNull()
    expect(result!.premiumHours).toBe(2)
    expect(result!.premiumCost).toBe(40)
  })

  it("returns 72h rule at exactly 24 hours", () => {
    const result = calculatePremiumPay(24, 15)
    // 24 is NOT within 24h (not <24), so should match 72h rule
    expect(result).not.toBeNull()
    expect(result!.premiumHours).toBe(4)
  })

  it("returns null at exactly 72 hours", () => {
    const result = calculatePremiumPay(72, 15)
    expect(result).toBeNull()
  })
})

describe("checkNoticePeriod", () => {
  it("returns compliant when notice period met", () => {
    const result = checkNoticePeriod("2026-03-29", "2026-03-22", 7)
    expect(result.compliant).toBe(true)
    expect(result.daysNotice).toBe(7)
    expect(result.requiredDays).toBe(7)
  })

  it("returns non-compliant when notice period not met", () => {
    const result = checkNoticePeriod("2026-03-27", "2026-03-22", 7)
    expect(result.compliant).toBe(false)
    expect(result.daysNotice).toBe(5)
    expect(result.requiredDays).toBe(7)
  })

  it("returns compliant with excess notice", () => {
    const result = checkNoticePeriod("2026-04-05", "2026-03-22", 7)
    expect(result.compliant).toBe(true)
    expect(result.daysNotice).toBe(14)
  })
})

describe("DEFAULT_COMPLIANCE_RULES", () => {
  it("has 7-day notice period", () => {
    expect(DEFAULT_COMPLIANCE_RULES.noticePeriodDays).toBe(7)
  })

  it("has 2 premium pay rules", () => {
    expect(DEFAULT_COMPLIANCE_RULES.premiumPayRules).toHaveLength(2)
  })
})
