"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { shiftPickups, shifts, employeeRoles, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "./audit"
import { calculateShiftHours } from "@/lib/utils/cost-calculator"
import { getEmployeeWeekShifts } from "@/lib/dal/swaps"

type PickupActionResult = {
  success: boolean
  message?: string
}

export async function createPickupRequest(data: {
  shiftId: number
}): Promise<PickupActionResult> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, message: "Not authenticated" }
  }

  const userId = Number(session.user.id)

  // Verify the shift exists and is open
  const [shift] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.id, data.shiftId), eq(shifts.status, "open")))

  if (!shift) {
    return { success: false, message: "Shift not found or not open" }
  }

  // Verify the employee has the required role
  const matchingRoles = await db
    .select()
    .from(employeeRoles)
    .where(
      and(
        eq(employeeRoles.userId, userId),
        eq(employeeRoles.roleName, shift.roleName)
      )
    )

  if (matchingRoles.length === 0) {
    return {
      success: false,
      message: `You don't have the ${shift.roleName} qualification`,
    }
  }

  await db.insert(shiftPickups).values({
    shiftId: data.shiftId,
    employeeId: userId,
    status: "pending",
  })

  logAuditEvent({
    action: "pickup.requested",
    userId,
    entityType: "shift_pickup",
    entityId: data.shiftId,
    details: { shiftId: data.shiftId, roleName: shift.roleName },
  })

  revalidatePath("/swaps")
  return { success: true }
}

export async function approvePickup(
  pickupId: number
): Promise<PickupActionResult> {
  const session = await auth()
  if (
    !session?.user ||
    !["manager", "supervisor"].includes(session.user.role)
  ) {
    return { success: false, message: "Unauthorized" }
  }

  const reviewerId = Number(session.user.id)

  // Fetch pickup request with optimistic locking
  const [pickup] = await db
    .select()
    .from(shiftPickups)
    .where(
      and(
        eq(shiftPickups.id, pickupId),
        eq(shiftPickups.status, "pending")
      )
    )

  if (!pickup) {
    return {
      success: false,
      message: "Pickup request not found or already processed",
    }
  }

  // Get the shift
  const [shift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, pickup.shiftId))

  if (!shift) {
    return { success: false, message: "Shift not found" }
  }

  // Get employee max hours
  const [employee] = await db
    .select({ maxHoursPerWeek: users.maxHoursPerWeek })
    .from(users)
    .where(eq(users.id, pickup.employeeId))

  const maxHours = employee?.maxHoursPerWeek ?? 40

  // Get employee's week shifts and calculate total hours
  const weekShifts = await getEmployeeWeekShifts(
    pickup.employeeId,
    shift.date
  )
  const currentHours = weekShifts.reduce(
    (sum, s) => sum + calculateShiftHours(s.startTime, s.endTime, s.breakMinutes),
    0
  )
  const newShiftHours = calculateShiftHours(
    shift.startTime,
    shift.endTime,
    shift.breakMinutes
  )

  if (currentHours + newShiftHours > maxHours) {
    // Auto-reject
    const reason = `Would exceed ${maxHours}h limit (${currentHours + newShiftHours}h total)`
    await db
      .update(shiftPickups)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(shiftPickups.id, pickupId))

    logAuditEvent({
      action: "pickup.auto_rejected",
      userId: reviewerId,
      entityType: "shift_pickup",
      entityId: pickupId,
      details: { reason, currentHours, newShiftHours },
    })

    revalidatePath("/swaps")
    return { success: false, message: reason }
  }

  // Approve
  await db
    .update(shiftPickups)
    .set({
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(shiftPickups.id, pickupId))

  // Assign the shift
  await db
    .update(shifts)
    .set({
      employeeId: pickup.employeeId,
      status: "assigned",
      updatedAt: new Date(),
    })
    .where(eq(shifts.id, pickup.shiftId))

  logAuditEvent({
    action: "pickup.approved",
    userId: reviewerId,
    entityType: "shift_pickup",
    entityId: pickupId,
    details: {
      employeeId: pickup.employeeId,
      shiftId: pickup.shiftId,
    },
  })

  revalidatePath("/swaps")
  revalidatePath("/schedule")
  return { success: true }
}

export async function rejectPickup(
  pickupId: number,
  reason?: string
): Promise<PickupActionResult> {
  const session = await auth()
  if (
    !session?.user ||
    !["manager", "supervisor"].includes(session.user.role)
  ) {
    return { success: false, message: "Unauthorized" }
  }

  const reviewerId = Number(session.user.id)

  const [updated] = await db
    .update(shiftPickups)
    .set({
      status: "rejected",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(
      and(
        eq(shiftPickups.id, pickupId),
        eq(shiftPickups.status, "pending")
      )
    )
    .returning()

  if (!updated) {
    return {
      success: false,
      message: "Pickup request not found or already processed",
    }
  }

  logAuditEvent({
    action: "pickup.rejected",
    userId: reviewerId,
    entityType: "shift_pickup",
    entityId: pickupId,
    details: { reason: reason ?? "No reason provided" },
  })

  revalidatePath("/swaps")
  return { success: true }
}
