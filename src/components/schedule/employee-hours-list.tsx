"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { CostSummary } from "@/lib/utils/cost-calculator"
import type { EmployeeWithRoles } from "@/lib/dal/employees"

interface EmployeeHoursListProps {
  employeeHours: Record<number, number>
  employees: EmployeeWithRoles[]
  overtimeAlerts: CostSummary["overtimeAlerts"]
}

export function EmployeeHoursList({
  employeeHours,
  employees,
  overtimeAlerts,
}: EmployeeHoursListProps) {
  const [expanded, setExpanded] = useState(false)

  // Build sorted list of employees with hours > 0
  const alertMap = new Map(
    overtimeAlerts.map((a) => [a.employeeId, a.level])
  )

  const employeesWithHours = employees
    .filter((e) => (employeeHours[e.id] || 0) > 0)
    .map((e) => ({
      id: e.id,
      name: e.name,
      hours: employeeHours[e.id] || 0,
      level: alertMap.get(e.id) ?? null,
    }))
    .sort((a, b) => b.hours - a.hours)

  const alertCount = overtimeAlerts.length

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-1"
        data-testid="schedule-per-employee-toggle"
      >
        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Per-Employee Hours
          {alertCount > 0 && (
            <span className="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
              {alertCount} alert{alertCount !== 1 ? "s" : ""}
            </span>
          )}
        </h4>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {employeesWithHours.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm"
            >
              <span className="truncate text-gray-700">{emp.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {emp.hours.toFixed(1)}h
                </span>
                {emp.level === "red" && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    Overtime
                  </span>
                )}
                {emp.level === "amber" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Near OT
                  </span>
                )}
              </div>
            </div>
          ))}
          {employeesWithHours.length === 0 && (
            <p className="py-2 text-center text-xs text-gray-400">
              No hours scheduled
            </p>
          )}
        </div>
      )}
    </div>
  )
}
