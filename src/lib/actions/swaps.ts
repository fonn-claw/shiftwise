"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { swapRequests, shifts, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "./audit"
import { validateSwapHours } from "@/lib/utils/swap-validation"
import { getEmployeeWeekShifts } from "@/lib/dal/swaps"

const createSwapSchema = z.object({
  requestorShiftId: z.number(),
  targetShiftId: z.number(),
})

type SwapActionResult = {
  success: boolean
  message?: string
}

export async function createSwapRequest(
  data: z.input<typeof createSwapSchema>
): Promise<SwapActionResult> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, message: "Not authenticated" }
  }

  const parsed = createSwapSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, message: "Invalid data" }
  }

  const userId = Number(session.user.id)

  // Verify requestor owns the shift
  const [requestorShift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, parsed.data.requestorShiftId))

  if (!requestorShift || requestorShift.employeeId !== userId) {
    return { success: false, message: "You can only swap your own shifts" }
  }

  // Verify target shift exists and is assigned
  const [targetShift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, parsed.data.targetShiftId))

  if (!targetShift || !targetShift.employeeId) {
    return { success: false, message: "Target shift not found or unassigned" }
  }

  await db.insert(swapRequests).values({
    requestorId: userId,
    requestorShiftId: parsed.data.requestorShiftId,
    targetEmployeeId: targetShift.employeeId,
    targetShiftId: parsed.data.targetShiftId,
    status: "pending",
  })

  logAuditEvent({
    action: "swap.requested",
    userId,
    entityType: "swap_request",
    entityId: null,
    details: {
      requestorShiftId: parsed.data.requestorShiftId,
      targetShiftId: parsed.data.targetShiftId,
      targetEmployeeId: targetShift.employeeId,
    },
  })

  revalidatePath("/swaps")
  return { success: true }
}

export async function approveSwap(
  swapId: number
): Promise<SwapActionResult> {
  const session = await auth()
  if (
    !session?.user ||
    !["manager", "supervisor"].includes(session.user.role)
  ) {
    return { success: false, message: "Unauthorized" }
  }

  const reviewerId = Number(session.user.id)

  // Fetch swap request with optimistic locking on pending status
  const [swap] = await db
    .select()
    .from(swapRequests)
    .where(
      and(eq(swapRequests.id, swapId), eq(swapRequests.status, "pending"))
    )

  if (!swap) {
    return {
      success: false,
      message: "Swap request not found or already processed",
    }
  }

  // Get both shifts
  const [requestorShift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, swap.requestorShiftId))
  const [targetShift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, swap.targetShiftId))

  if (!requestorShift || !targetShift) {
    return { success: false, message: "Shifts not found" }
  }

  // Get employee names for validation messages
  const [requestorUser] = await db
    .select({ name: users.name, maxHoursPerWeek: users.maxHoursPerWeek })
    .from(users)
    .where(eq(users.id, swap.requestorId))
  const [targetUser] = await db
    .select({ name: users.name, maxHoursPerWeek: users.maxHoursPerWeek })
    .from(users)
    .where(eq(users.id, swap.targetEmployeeId))

  // Get week shifts for both employees
  const requestorWeekShifts = await getEmployeeWeekShifts(
    swap.requestorId,
    requestorShift.date
  )
  const targetWeekShifts = await getEmployeeWeekShifts(
    swap.targetEmployeeId,
    targetShift.date
  )

  // Validate hours
  const validation = validateSwapHours({
    requestorCurrentShifts: requestorWeekShifts,
    targetCurrentShifts: targetWeekShifts,
    requestorSwapShift: requestorShift,
    targetSwapShift: targetShift,
    requestorName: requestorUser?.name ?? "Requestor",
    targetName: targetUser?.name ?? "Target",
    maxHours: Math.min(
      requestorUser?.maxHoursPerWeek ?? 40,
      targetUser?.maxHoursPerWeek ?? 40
    ),
  })

  if (!validation.valid) {
    // Auto-reject with reason
    await db
      .update(swapRequests)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reason: validation.reason,
        updatedAt: new Date(),
      })
      .where(eq(swapRequests.id, swapId))

    logAuditEvent({
      action: "swap.auto_rejected",
      userId: reviewerId,
      entityType: "swap_request",
      entityId: swapId,
      details: { reason: validation.reason },
    })

    revalidatePath("/swaps")
    return { success: false, message: validation.reason }
  }

  // Approve: update swap status
  await db
    .update(swapRequests)
    .set({
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(swapRequests.id, swapId))

  // Swap the employeeIds on the two shifts
  await db
    .update(shifts)
    .set({
      employeeId: swap.targetEmployeeId,
      updatedAt: new Date(),
    })
    .where(eq(shifts.id, swap.requestorShiftId))

  await db
    .update(shifts)
    .set({
      employeeId: swap.requestorId,
      updatedAt: new Date(),
    })
    .where(eq(shifts.id, swap.targetShiftId))

  logAuditEvent({
    action: "swap.approved",
    userId: reviewerId,
    entityType: "swap_request",
    entityId: swapId,
    details: {
      requestorId: swap.requestorId,
      targetEmployeeId: swap.targetEmployeeId,
      requestorShiftId: swap.requestorShiftId,
      targetShiftId: swap.targetShiftId,
    },
  })

  revalidatePath("/swaps")
  revalidatePath("/schedule")
  return { success: true }
}

export async function rejectSwap(
  swapId: number,
  reason?: string
): Promise<SwapActionResult> {
  const session = await auth()
  if (
    !session?.user ||
    !["manager", "supervisor"].includes(session.user.role)
  ) {
    return { success: false, message: "Unauthorized" }
  }

  const reviewerId = Number(session.user.id)

  const [updated] = await db
    .update(swapRequests)
    .set({
      status: "rejected",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reason: reason ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(swapRequests.id, swapId), eq(swapRequests.status, "pending"))
    )
    .returning()

  if (!updated) {
    return {
      success: false,
      message: "Swap request not found or already processed",
    }
  }

  logAuditEvent({
    action: "swap.rejected",
    userId: reviewerId,
    entityType: "swap_request",
    entityId: swapId,
    details: { reason: reason ?? "No reason provided" },
  })

  revalidatePath("/swaps")
  return { success: true }
}

export async function cancelSwap(
  swapId: number
): Promise<SwapActionResult> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, message: "Not authenticated" }
  }

  const userId = Number(session.user.id)

  // Verify the user is the requestor and status is pending
  const [swap] = await db
    .select()
    .from(swapRequests)
    .where(
      and(
        eq(swapRequests.id, swapId),
        eq(swapRequests.requestorId, userId),
        eq(swapRequests.status, "pending")
      )
    )

  if (!swap) {
    return {
      success: false,
      message: "Swap request not found or cannot be cancelled",
    }
  }

  await db
    .update(swapRequests)
    .set({
      status: "rejected",
      reason: "Cancelled by requestor",
      updatedAt: new Date(),
    })
    .where(eq(swapRequests.id, swapId))

  logAuditEvent({
    action: "swap.cancelled",
    userId,
    entityType: "swap_request",
    entityId: swapId,
    details: { cancelledBy: userId },
  })

  revalidatePath("/swaps")
  return { success: true }
}
