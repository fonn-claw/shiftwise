import { getDashboardData } from "@/lib/dal/dashboard"
import { TeamDashboard } from "@/components/dashboard/team-dashboard"

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <TeamDashboard
      todayShifts={data.todayShifts}
      weekSummary={data.weekSummary}
      historicalCosts={data.historicalCosts}
      storeName={data.storeName}
      weeklyBudget={data.weeklyBudget}
      todayDate={data.todayDate}
    />
  )
}
