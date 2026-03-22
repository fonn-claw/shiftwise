import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  shifts,
  swapRequests,
  shiftPickups,
  users,
} from "@/lib/db/schema"
import { eq, and, gte, lte, or, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { startOfWeek, addDays, format } from "date-fns"

// ---- Types ----

export type OpenShift = {
  id: number
  date: string
  startTime: string
  endTime: string
  roleName: "cashier" | "stock" | "manager" | "visual_merch"
  breakMinutes: number
  storeId: number
}

export type SwapRequestRow = {
  id: number
  status: "pending" | "approved" | "rejected"
  reason: string | null
  createdAt: Date
  reviewedAt: Date | null
  requestor: { id: number; name: string }
  requestorShift: {
    id: number
    date: string
    startTime: string
    endTime: string
    roleName: string
    breakMinutes: number
  }
  targetEmployee: { id: number; name: string }
  targetShift: {
    id: number
    date: string
    startTime: string
    endTime: string
    roleName: string
    breakMinutes: number
  }
  reviewerName: string | null
}

export type PickupRequestRow = {
  id: number
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  employee: { id: number; name: string }
  shift: {
    id: number
    date: string
    startTime: string
    endTime: string
    roleName: string
    breakMinutes: number
  }
}

// ---- Queries ----

export async function getOpenShifts(): Promise<OpenShift[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  const rows = await db
    .select({
      id: shifts.id,
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      roleName: shifts.roleName,
      breakMinutes: shifts.breakMinutes,
      storeId: shifts.storeId,
    })
    .from(shifts)
    .where(eq(shifts.status, "open"))
    .orderBy(shifts.date, shifts.startTime)

  return rows
}

export async function getSwapRequests(filter?: {
  status?: string
}): Promise<SwapRequestRow[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  const requestor = alias(users, "requestor")
  const target = alias(users, "target_employee")
  const reviewer = alias(users, "reviewer")
  const reqShift = alias(shifts, "requestor_shift")
  const tgtShift = alias(shifts, "target_shift")

  let query = db
    .select({
      id: swapRequests.id,
      status: swapRequests.status,
      reason: swapRequests.reason,
      createdAt: swapRequests.createdAt,
      reviewedAt: swapRequests.reviewedAt,
      requestorId: requestor.id,
      requestorName: requestor.name,
      reqShiftId: reqShift.id,
      reqShiftDate: reqShift.date,
      reqShiftStart: reqShift.startTime,
      reqShiftEnd: reqShift.endTime,
      reqShiftRole: reqShift.roleName,
      reqShiftBreak: reqShift.breakMinutes,
      targetId: target.id,
      targetName: target.name,
      tgtShiftId: tgtShift.id,
      tgtShiftDate: tgtShift.date,
      tgtShiftStart: tgtShift.startTime,
      tgtShiftEnd: tgtShift.endTime,
      tgtShiftRole: tgtShift.roleName,
      tgtShiftBreak: tgtShift.breakMinutes,
      reviewerName: reviewer.name,
    })
    .from(swapRequests)
    .innerJoin(requestor, eq(swapRequests.requestorId, requestor.id))
    .innerJoin(target, eq(swapRequests.targetEmployeeId, target.id))
    .innerJoin(reqShift, eq(swapRequests.requestorShiftId, reqShift.id))
    .innerJoin(tgtShift, eq(swapRequests.targetShiftId, tgtShift.id))
    .leftJoin(reviewer, eq(swapRequests.reviewedBy, reviewer.id))
    .orderBy(swapRequests.createdAt)
    .$dynamic()

  if (filter?.status) {
    query = query.where(
      eq(
        swapRequests.status,
        filter.status as "pending" | "approved" | "rejected"
      )
    )
  }

  // Employee role: only show swaps where they are requestor or target
  if (session.user.role === "employee") {
    const userId = Number(session.user.id)
    const statusCondition = filter?.status
      ? eq(
          swapRequests.status,
          filter.status as "pending" | "approved" | "rejected"
        )
      : undefined
    const roleCondition = or(
      eq(swapRequests.requestorId, userId),
      eq(swapRequests.targetEmployeeId, userId)
    )
    query = query.where(
      statusCondition
        ? and(statusCondition, roleCondition)
        : roleCondition
    )
  }

  const rows = await query

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    reason: r.reason,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
    requestor: { id: r.requestorId, name: r.requestorName },
    requestorShift: {
      id: r.reqShiftId,
      date: r.reqShiftDate,
      startTime: r.reqShiftStart,
      endTime: r.reqShiftEnd,
      roleName: r.reqShiftRole,
      breakMinutes: r.reqShiftBreak,
    },
    targetEmployee: { id: r.targetId, name: r.targetName },
    targetShift: {
      id: r.tgtShiftId,
      date: r.tgtShiftDate,
      startTime: r.tgtShiftStart,
      endTime: r.tgtShiftEnd,
      roleName: r.tgtShiftRole,
      breakMinutes: r.tgtShiftBreak,
    },
    reviewerName: r.reviewerName,
  }))
}

export async function getPickupRequests(filter?: {
  status?: string
}): Promise<PickupRequestRow[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  let query = db
    .select({
      id: shiftPickups.id,
      status: shiftPickups.status,
      createdAt: shiftPickups.createdAt,
      employeeId: users.id,
      employeeName: users.name,
      shiftId: shifts.id,
      shiftDate: shifts.date,
      shiftStart: shifts.startTime,
      shiftEnd: shifts.endTime,
      shiftRole: shifts.roleName,
      shiftBreak: shifts.breakMinutes,
    })
    .from(shiftPickups)
    .innerJoin(users, eq(shiftPickups.employeeId, users.id))
    .innerJoin(shifts, eq(shiftPickups.shiftId, shifts.id))
    .orderBy(shiftPickups.createdAt)
    .$dynamic()

  if (filter?.status) {
    query = query.where(
      eq(
        shiftPickups.status,
        filter.status as "pending" | "approved" | "rejected"
      )
    )
  }

  // Employee role: only show their own requests
  if (session.user.role === "employee") {
    const userId = Number(session.user.id)
    const statusCondition = filter?.status
      ? eq(
          shiftPickups.status,
          filter.status as "pending" | "approved" | "rejected"
        )
      : undefined
    const empCondition = eq(shiftPickups.employeeId, userId)
    query = query.where(
      statusCondition
        ? and(statusCondition, empCondition)
        : empCondition
    )
  }

  const rows = await query

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    employee: { id: r.employeeId, name: r.employeeName },
    shift: {
      id: r.shiftId,
      date: r.shiftDate,
      startTime: r.shiftStart,
      endTime: r.shiftEnd,
      roleName: r.shiftRole,
      breakMinutes: r.shiftBreak,
    },
  }))
}

export async function getEmployeeWeekShifts(
  employeeId: number,
  weekStartDate: string
): Promise<
  {
    id: number
    employeeId: number | null
    startTime: string
    endTime: string
    breakMinutes: number
    date: string
  }[]
> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  const monday = startOfWeek(new Date(weekStartDate + "T12:00:00"), {
    weekStartsOn: 1,
  })
  const sunday = addDays(monday, 6)
  const mondayStr = format(monday, "yyyy-MM-dd")
  const sundayStr = format(sunday, "yyyy-MM-dd")

  const rows = await db
    .select({
      id: shifts.id,
      employeeId: shifts.employeeId,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      breakMinutes: shifts.breakMinutes,
      date: shifts.date,
    })
    .from(shifts)
    .where(
      and(
        eq(shifts.employeeId, employeeId),
        gte(shifts.date, mondayStr),
        lte(shifts.date, sundayStr)
      )
    )

  return rows
}
