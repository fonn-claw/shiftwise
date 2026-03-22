import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  getOpenShifts,
  getSwapRequests,
  getPickupRequests,
  getEmployeeWeekShifts,
} from "@/lib/dal/swaps"
import { SwapsPageClient } from "@/components/swaps/swaps-page-client"
import { calculateShiftHours } from "@/lib/utils/cost-calculator"

export default async function SwapsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [openShifts, swapRequests, pickupRequests] = await Promise.all([
    getOpenShifts(),
    getSwapRequests(),
    getPickupRequests(),
  ])

  // Compute week hours for employees involved in swaps (for hours impact display)
  const employeeIds = new Set<number>()
  for (const swap of swapRequests) {
    employeeIds.add(swap.requestor.id)
    employeeIds.add(swap.targetEmployee.id)
  }

  const employeeWeekHours: Record<number, number> = {}

  // Use the first swap's shift date as week reference; fallback to today
  const refDate =
    swapRequests.length > 0
      ? swapRequests[0].requestorShift.date
      : new Date().toISOString().slice(0, 10)

  for (const empId of employeeIds) {
    const weekShifts = await getEmployeeWeekShifts(empId, refDate)
    employeeWeekHours[empId] = weekShifts.reduce(
      (sum, s) =>
        sum + calculateShiftHours(s.startTime, s.endTime, s.breakMinutes),
      0
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Shift Swaps &amp; Coverage
        </h2>
        <p className="text-sm text-gray-500">
          Manage open shifts, swap requests, and pickup coverage
        </p>
      </div>

      <SwapsPageClient
        openShifts={openShifts}
        swapRequests={swapRequests}
        pickupRequests={pickupRequests}
        userRole={session.user.role}
        userId={Number(session.user.id)}
        employeeWeekHours={employeeWeekHours}
      />
    </div>
  )
}
