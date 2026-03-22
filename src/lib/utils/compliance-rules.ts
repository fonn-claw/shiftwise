/**
 * Compliance rules for predictive scheduling laws.
 * Pure functions — safe for client-side use.
 */

import { differenceInCalendarDays } from "date-fns"

export interface PremiumPayRule {
  withinHours: number
  premiumHours: number
  description: string
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  noticePeriodDays: number
  premiumPayRules: PremiumPayRule[]
}

export const DEFAULT_COMPLIANCE_RULES: ComplianceRule = {
  id: "default-predictive-scheduling",
  name: "Predictive Scheduling",
  description:
    "Standard predictive scheduling rules based on California/NYC/Seattle ordinances",
  noticePeriodDays: 7,
  premiumPayRules: [
    {
      withinHours: 24,
      premiumHours: 2,
      description: "Changes within 24 hours of shift: 2-hour premium pay",
    },
    {
      withinHours: 72,
      premiumHours: 4,
      description: "Changes within 72 hours of shift: 4-hour premium pay",
    },
  ],
}

export interface PremiumPayResult {
  premiumHours: number
  premiumCost: number
  rule: string
}

/**
 * Calculate premium pay owed for a schedule change made within a certain
 * number of hours before the shift starts.
 *
 * Returns the matching rule with the smallest `withinHours` window,
 * or null if no premium applies.
 */
export function calculatePremiumPay(
  hoursBeforeShift: number,
  employeeHourlyRate: number,
  rules?: ComplianceRule
): PremiumPayResult | null {
  const complianceRules = rules ?? DEFAULT_COMPLIANCE_RULES

  // Find all rules where hoursBeforeShift falls strictly within the window
  const matchingRules = complianceRules.premiumPayRules
    .filter((r) => hoursBeforeShift < r.withinHours)
    .sort((a, b) => a.withinHours - b.withinHours)

  if (matchingRules.length === 0) return null

  const bestMatch = matchingRules[0]
  return {
    premiumHours: bestMatch.premiumHours,
    premiumCost: bestMatch.premiumHours * employeeHourlyRate,
    rule: bestMatch.description,
  }
}

/**
 * Check whether a shift posting meets the required notice period.
 */
export function checkNoticePeriod(
  shiftDate: string,
  postingDate: string,
  requiredDays: number
): { compliant: boolean; daysNotice: number; requiredDays: number } {
  const daysNotice = differenceInCalendarDays(
    new Date(shiftDate),
    new Date(postingDate)
  )

  return {
    compliant: daysNotice >= requiredDays,
    daysNotice,
    requiredDays,
  }
}
