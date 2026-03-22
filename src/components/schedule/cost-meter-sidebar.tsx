"use client"

import { Clock, DollarSign, TrendingUp } from "lucide-react"
import type { CostSummary } from "@/lib/utils/cost-calculator"
import type { EmployeeWithRoles } from "@/lib/dal/employees"
import { DailyBreakdown } from "./daily-breakdown"
import { BudgetChart } from "./budget-chart"
import { EmployeeHoursList } from "./employee-hours-list"

interface CostMeterSidebarProps {
  costs: CostSummary
  employees: EmployeeWithRoles[]
  budget: number
  weekDays: Date[]
}

export function CostMeterSidebar({
  costs,
  employees,
  budget,
  weekDays,
}: CostMeterSidebarProps) {
  const budgetColor =
    costs.budgetPercent > 100
      ? "text-red-600"
      : costs.budgetPercent >= 80
        ? "text-amber-600"
        : "text-green-600"

  const barColor =
    costs.budgetPercent > 100
      ? "bg-red-500"
      : costs.budgetPercent >= 80
        ? "bg-amber-500"
        : "bg-green-500"

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Labor Cost Meter
        </h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <Clock className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-xs text-gray-500">Total Hours</div>
            <div className="text-lg font-semibold text-gray-900">
              {costs.totalHours.toFixed(1)} hrs
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-xs text-gray-500">Total Cost</div>
            <div className="text-lg font-semibold text-gray-900">
              $
              {costs.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-xs text-gray-500">Budget Used</div>
            <div className={`text-lg font-semibold ${budgetColor}`}>
              {costs.budgetPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{
              width: `${Math.min(costs.budgetPercent, 100)}%`,
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          $
          {costs.totalCost.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{" "}
          of $
          {budget.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{" "}
          budget
        </p>
      </div>

      {/* Daily Breakdown */}
      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Daily Breakdown
        </h4>
        <DailyBreakdown
          dailyCosts={costs.dailyCosts}
          dailyHours={costs.dailyHours}
          weekDays={weekDays}
        />
      </div>

      {/* Budget Chart */}
      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Budget vs Actual
        </h4>
        <BudgetChart
          dailyCosts={costs.dailyCosts}
          weeklyBudget={budget}
          weekDays={weekDays}
        />
      </div>

      {/* Employee Hours */}
      <EmployeeHoursList
        employeeHours={costs.employeeHours}
        employees={employees}
        overtimeAlerts={costs.overtimeAlerts}
      />
    </div>
  )
}
