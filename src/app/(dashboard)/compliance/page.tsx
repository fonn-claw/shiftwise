import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CompliancePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Only managers can access compliance
  if (session.user.role !== "manager") {
    redirect("/schedule")
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Compliance</h2>
        <p className="text-sm text-gray-500">
          Predictive scheduling compliance tracker
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        Compliance dashboard coming in Phase 3
      </div>
    </div>
  )
}
