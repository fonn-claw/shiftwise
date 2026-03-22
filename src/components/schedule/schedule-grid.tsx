"use client"

import { useMemo } from "react"
import { format, isToday, parseISO } from "date-fns"
import { Plus } from "lucide-react"
import { getWeekDays, isEmployeeAvailable } from "@/lib/utils/schedule-helpers"
import { ROLE_COLORS } from "@/lib/constants"
import { ShiftCard } from "./shift-card"
import type { EmployeeWithRoles } from "@/lib/dal/employees"
import type { ShiftRow } from "@/lib/dal/shifts"

interface ScheduleGridProps {
  shifts: ShiftRow[]
  employees: EmployeeWithRoles[]
  weekStart: string
  onCellClick: (employeeId: number, date: string) => void
  onShiftClick: (shift: ShiftRow) => void
}

export function ScheduleGrid({
  shifts,
  employees,
  weekStart,
  onCellClick,
  onShiftClick,
}: ScheduleGridProps) {
  const weekDays = useMemo(
    () => getWeekDays(parseISO(weekStart)),
    [weekStart]
  )

  // Index shifts by "employeeId-date" for quick lookup
  const shiftIndex = useMemo(() => {
    const index = new Map<string, ShiftRow[]>()
    for (const shift of shifts) {
      const key = `${shift.employeeId ?? "open"}-${shift.date}`
      const existing = index.get(key) || []
      existing.push(shift)
      index.set(key, existing)
    }
    return index
  }, [shifts])

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <div
        className="grid min-w-[900px]"
        style={{
          gridTemplateColumns: "200px repeat(7, 1fr)",
        }}
      >
        {/* Header row */}
        <div className="border-b border-r border-gray-200 bg-gray-50 p-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Employee
          </span>
        </div>
        {weekDays.map((day) => {
          const today = isToday(day)
          return (
            <div
              key={day.toISOString()}
              className={`border-b border-r border-gray-200 p-3 text-center last:border-r-0 ${
                today ? "bg-indigo-50/50" : "bg-gray-50"
              }`}
            >
              <div
                className={`text-xs font-semibold uppercase tracking-wider ${
                  today ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                {format(day, "EEE")}
              </div>
              <div
                className={`text-sm font-medium ${
                  today ? "text-indigo-700" : "text-gray-700"
                }`}
              >
                {format(day, "MMM d")}
              </div>
            </div>
          )
        })}

        {/* Employee rows */}
        {employees.map((employee) => (
          <EmployeeRow
            key={employee.id}
            employee={employee}
            weekDays={weekDays}
            shiftIndex={shiftIndex}
            onCellClick={onCellClick}
            onShiftClick={onShiftClick}
          />
        ))}
      </div>
    </div>
  )
}

function EmployeeRow({
  employee,
  weekDays,
  shiftIndex,
  onCellClick,
  onShiftClick,
}: {
  employee: EmployeeWithRoles
  weekDays: Date[]
  shiftIndex: Map<string, ShiftRow[]>
  onCellClick: (employeeId: number, date: string) => void
  onShiftClick: (shift: ShiftRow) => void
}) {
  return (
    <>
      {/* Employee name cell */}
      <div className="flex items-start gap-2 border-b border-r border-gray-200 p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-gray-900">
            {employee.name}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {employee.jobRoles.map((role) => {
              const color =
                ROLE_COLORS[role.roleName as keyof typeof ROLE_COLORS]
              return (
                <span
                  key={role.id}
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${color?.bg} ${color?.text}`}
                >
                  {color?.label ?? role.roleName}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Day cells */}
      {weekDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const today = isToday(day)
        const available = isEmployeeAvailable(employee.availability, day)
        const cellShifts = shiftIndex.get(`${employee.id}-${dateStr}`) || []

        return (
          <div
            key={dateStr}
            onClick={() => {
              if (available && cellShifts.length === 0) {
                onCellClick(employee.id, dateStr)
              }
            }}
            className={`group relative min-h-[72px] border-b border-r border-gray-200 p-1.5 last:border-r-0 ${
              !available ? "border-2 border-red-300 bg-red-50" : ""
            } ${today && available ? "bg-indigo-50/50" : ""} ${
              available && cellShifts.length === 0
                ? "cursor-pointer hover:bg-gray-50"
                : ""
            }`}
          >
            {!available && cellShifts.length === 0 && (
              <span className="text-[10px] text-red-400">Unavailable</span>
            )}

            {cellShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onClick={() => onShiftClick(shift)}
              />
            ))}

            {available && cellShifts.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <Plus className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
