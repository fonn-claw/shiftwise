/**
 * Swap validation utilities.
 * Pure functions — safe for client-side use.
 */

import { calculateShiftHours } from "./cost-calculator"

export type ShiftForValidation = {
  id: number
  employeeId: number | null
  startTime: string
  endTime: string
  breakMinutes: number
  date: string
}

type SwapValidationResult =
  | { valid: true }
  | { valid: false; reason: string }

/**
 * Validate that a swap between two employees will not cause either
 * to exceed their maximum weekly hours.
 *
 * Requestor gives away `requestorSwapShift` and gains `targetSwapShift`.
 * Target gives away `targetSwapShift` and gains `requestorSwapShift`.
 */
export function validateSwapHours(params: {
  requestorCurrentShifts: ShiftForValidation[]
  targetCurrentShifts: ShiftForValidation[]
  requestorSwapShift: ShiftForValidation
  targetSwapShift: ShiftForValidation
  requestorName: string
  targetName: string
  maxHours?: number
}): SwapValidationResult {
  const {
    requestorCurrentShifts,
    targetCurrentShifts,
    requestorSwapShift,
    targetSwapShift,
    requestorName,
    targetName,
    maxHours = 40,
  } = params

  const shiftHours = (s: ShiftForValidation) =>
    calculateShiftHours(s.startTime, s.endTime, s.breakMinutes)

  const totalHours = (shifts: ShiftForValidation[]) =>
    shifts.reduce((sum, s) => sum + shiftHours(s), 0)

  const requestorCurrentTotal = totalHours(requestorCurrentShifts)
  const requestorNewTotal =
    requestorCurrentTotal - shiftHours(requestorSwapShift) + shiftHours(targetSwapShift)

  if (requestorNewTotal > maxHours) {
    return {
      valid: false,
      reason: `${requestorName} would have ${requestorNewTotal} hours, exceeding ${maxHours}h limit`,
    }
  }

  const targetCurrentTotal = totalHours(targetCurrentShifts)
  const targetNewTotal =
    targetCurrentTotal - shiftHours(targetSwapShift) + shiftHours(requestorSwapShift)

  if (targetNewTotal > maxHours) {
    return {
      valid: false,
      reason: `${targetName} would have ${targetNewTotal} hours, exceeding ${maxHours}h limit`,
    }
  }

  return { valid: true }
}
