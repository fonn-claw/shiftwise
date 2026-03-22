"use client"

import { useMemo, memo } from "react"
import { format, isToday, parseISO } from "date-fns"
import { DragDropProvider } from "@dnd-kit/react"
import { getWeekDays } from "@/lib/utils/schedule-helpers"
import { ROLE_COLORS } from "@/lib/constants"
import { ShiftCard } from "./shift-card"
import { DayCell } from "./day-cell"
import type { EmployeeWithRoles } from "@/lib/dal/employees"
import type { ShiftRow } from "@/lib/dal/shifts"

interface ScheduleGridProps {
  shifts: ShiftRow[]
  employees: EmployeeWithRoles[]
  weekStart: string
  onCellClick: (employeeId: number, date: string) => void
  onShiftClick: (shift: ShiftRow) => void
  onShiftMove: (shiftId: number, newEmployeeId: number, newDate: string) => void
  isManager: boolean
}

export function ScheduleGrid({
  shifts,
  employees,
  weekStart,
  onCellClick,
  onShiftClick,
  onShiftMove,
  isManager,
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

  function handleDragEnd(event: { operation: { source: { data?: { shift?: ShiftRow } } | null; target: { data?: { employeeId?: number; date?: string } } | null } }) {
    const { source, target } = event.operation
    if (!source || !target) return

    const shift = source.data?.shift
    const employeeId = target.data?.employeeId
    const date = target.data?.date

    if (!shift || employeeId == null || !date) return
    if (shift.employeeId === employeeId && shift.date === date) return

    onShiftMove(shift.id, employeeId, date)
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
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
              isManager={isManager}
            />
          ))}
        </div>
      </div>
    </DragDropProvider>
  )
}

const EmployeeRow = memo(function EmployeeRow({
  employee,
  weekDays,
  shiftIndex,
  onCellClick,
  onShiftClick,
  isManager,
}: {
  employee: EmployeeWithRoles
  weekDays: Date[]
  shiftIndex: Map<string, ShiftRow[]>
  onCellClick: (employeeId: number, date: string) => void
  onShiftClick: (shift: ShiftRow) => void
  isManager: boolean
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
        const cellShifts = shiftIndex.get(`${employee.id}-${dateStr}`) || []

        return (
          <DayCell
            key={dateStr}
            employeeId={employee.id}
            date={dateStr}
            dateObj={day}
            employeeAvailability={employee.availability}
            isToday={today}
            onClick={() => onCellClick(employee.id, dateStr)}
            isManager={isManager}
            isEmpty={cellShifts.length === 0}
          >
            {cellShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onClick={() => onShiftClick(shift)}
                isManager={isManager}
              />
            ))}
          </DayCell>
        )
      })}
    </>
  )
})
