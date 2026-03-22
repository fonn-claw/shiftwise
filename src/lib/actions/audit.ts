"use server"

import { db } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"

export async function logAuditEvent(params: {
  action: string
  userId: number
  entityType: string
  entityId: number | null
  details: Record<string, unknown>
}) {
  await db.insert(auditLog).values({
    action: params.action,
    userId: params.userId,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
  })
}
