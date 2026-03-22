import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { auditLog, shifts, users } from "@/lib/db/schema"
import { and, desc, eq, gte, lte, like, sql } from "drizzle-orm"
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  differenceInHours,
} from "date-fns"
import {
  checkNoticePeriod,
  calculatePremiumPay,
  DEFAULT_COMPLIANCE_RULES,
} from "@/lib/utils/compliance-rules"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComplianceWeek = {
  weekLabel: string
  shiftCount: number
  isCompliant: boolean
  daysNotice: number
  requiredDays: number
}

export type ComplianceStatus = {
  currentWeek: ComplianceWeek
  nextWeek: ComplianceWeek
  rule: typeof DEFAULT_COMPLIANCE_RULES
}

export type AuditEntry = {
  id: number
  action: string
  userName: string | null
  details: Record<string, unknown>
  entityType: string
  entityId: number | null
  createdAt: Date
}

export type PremiumPayEntry = {
  auditId: number
  action: string
  shiftDate: string
  shiftTime: string
  employeeName: string
  hourlyRate: number
  premiumHours: number
  premiumCost: number
  rule: string
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireManager() {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")
  if (session.user.role !== "manager") throw new Error("Not authorized")
  return session
}

function weekLabel(monday: Date): string {
  const sunday = endOfWeek(monday, { weekStartsOn: 1 })
  return `${format(monday, "MMM d")} - ${format(sunday, "MMM d, yyyy")}`
}

// ---------------------------------------------------------------------------
// getComplianceStatus
// ---------------------------------------------------------------------------

export async function getComplianceStatus(): Promise<ComplianceStatus> {
  await requireManager()

  const now = new Date()
  const currentMonday = startOfWeek(now, { weekStartsOn: 1 })
  const nextMonday = addWeeks(currentMonday, 1)

  async function weekStatus(monday: Date): Promise<ComplianceWeek> {
    const sunday = endOfWeek(monday, { weekStartsOn: 1 })
    const mondayStr = format(monday, "yyyy-MM-dd")
    const sundayStr = format(sunday, "yyyy-MM-dd")

    const weekShifts = await db
      .select()
      .from(shifts)
      .where(and(gte(shifts.date, mondayStr), lte(shifts.date, sundayStr)))

    // Find the earliest audit entry for shifts in this week to determine "posting date"
    const earliestAudit = await db
      .select({ createdAt: auditLog.createdAt })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.entityType, "shift"),
          eq(auditLog.action, "shift.created")
        )
      )
      .orderBy(auditLog.createdAt)
      .limit(1)

    // Use the earliest audit log entry as the posting date, or "now" if none found
    const postingDate = earliestAudit[0]
      ? format(earliestAudit[0].createdAt, "yyyy-MM-dd")
      : format(now, "yyyy-MM-dd")

    const notice = checkNoticePeriod(
      mondayStr,
      postingDate,
      DEFAULT_COMPLIANCE_RULES.noticePeriodDays
    )

    return {
      weekLabel: weekLabel(monday),
      shiftCount: weekShifts.length,
      isCompliant: notice.compliant,
      daysNotice: notice.daysNotice,
      requiredDays: notice.requiredDays,
    }
  }

  const [currentWeek, nextWeek] = await Promise.all([
    weekStatus(currentMonday),
    weekStatus(nextMonday),
  ])

  return {
    currentWeek,
    nextWeek,
    rule: DEFAULT_COMPLIANCE_RULES,
  }
}

// ---------------------------------------------------------------------------
// getAuditLog
// ---------------------------------------------------------------------------

export async function getAuditLog(filters?: {
  startDate?: string
  endDate?: string
  employeeId?: number
  action?: string
  limit?: number
  offset?: number
}): Promise<{ entries: AuditEntry[]; total: number }> {
  await requireManager()

  const conditions = []

  if (filters?.startDate) {
    conditions.push(gte(auditLog.createdAt, new Date(filters.startDate)))
  }
  if (filters?.endDate) {
    const end = new Date(filters.endDate)
    end.setHours(23, 59, 59, 999)
    conditions.push(lte(auditLog.createdAt, end))
  }
  if (filters?.action) {
    conditions.push(eq(auditLog.action, filters.action))
  }
  if (filters?.employeeId) {
    conditions.push(eq(auditLog.userId, filters.employeeId))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [countResult, entries] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(where),
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        userName: users.name,
        details: auditLog.details,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(filters?.limit ?? 50)
      .offset(filters?.offset ?? 0),
  ])

  return {
    entries: entries.map((e) => ({
      ...e,
      details: (e.details ?? {}) as Record<string, unknown>,
    })),
    total: countResult[0]?.count ?? 0,
  }
}

// ---------------------------------------------------------------------------
// getPremiumPayChanges
// ---------------------------------------------------------------------------

export async function getPremiumPayChanges(): Promise<PremiumPayEntry[]> {
  await requireManager()

  // Get recent shift-related audit entries
  const recentChanges = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      details: auditLog.details,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.entityType, "shift"),
        like(auditLog.action, "shift.%")
      )
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(100)

  const results: PremiumPayEntry[] = []

  for (const entry of recentChanges) {
    if (!entry.entityId) continue

    // Get the shift that was affected
    const [shift] = await db
      .select({
        date: shifts.date,
        startTime: shifts.startTime,
        employeeId: shifts.employeeId,
      })
      .from(shifts)
      .where(eq(shifts.id, entry.entityId))

    if (!shift || !shift.employeeId) continue

    // Get the employee
    const [employee] = await db
      .select({
        name: users.name,
        hourlyRate: users.hourlyRate,
      })
      .from(users)
      .where(eq(users.id, shift.employeeId))

    if (!employee) continue

    // Calculate hours between the audit event and the shift start
    const shiftStart = new Date(`${shift.date}T${shift.startTime}:00`)
    const hoursBeforeShift = differenceInHours(shiftStart, entry.createdAt)

    // Only consider changes made before the shift (positive hours)
    if (hoursBeforeShift < 0) continue

    const premium = calculatePremiumPay(
      hoursBeforeShift,
      Number(employee.hourlyRate)
    )

    if (premium) {
      results.push({
        auditId: entry.id,
        action: entry.action,
        shiftDate: shift.date,
        shiftTime: shift.startTime,
        employeeName: employee.name,
        hourlyRate: Number(employee.hourlyRate),
        premiumHours: premium.premiumHours,
        premiumCost: premium.premiumCost,
        rule: premium.rule,
        createdAt: entry.createdAt,
      })
    }
  }

  return results
}
