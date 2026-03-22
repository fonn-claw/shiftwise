import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  getComplianceStatus,
  getAuditLog,
  getPremiumPayChanges,
} from "@/lib/dal/compliance"
import { ComplianceStatusCards } from "@/components/compliance/compliance-status"
import { PremiumPayCard } from "@/components/compliance/premium-pay-card"
import { AuditLog } from "@/components/compliance/audit-log"

export default async function CompliancePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (session.user.role !== "manager") {
    redirect("/schedule")
  }

  const [complianceStatus, auditData, premiumPayChanges] = await Promise.all([
    getComplianceStatus(),
    getAuditLog({ limit: 50 }),
    getPremiumPayChanges(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Compliance Dashboard
        </h2>
        <p className="text-sm text-gray-500">
          Predictive scheduling compliance and audit trail
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ComplianceStatusCards status={complianceStatus} />
          <PremiumPayCard entries={premiumPayChanges} />
        </div>

        <div>
          <AuditLog
            initialEntries={auditData.entries}
            totalCount={auditData.total}
          />
        </div>
      </div>
    </div>
  )
}
