"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { calculateWeekCosts } from "@/lib/utils/cost-calculator"
import {
  getWeekDays,
  formatWeekLabel,
  getNextWeek,
  getPrevWeek,
} from "@/lib/utils/schedule-helpers"
import {
  createShift,
  updateShift,
  deleteShift,
} from "@/lib/actions/shifts"
import { ScheduleGrid } from "./schedule-grid"
import { CostMeterSidebar } from "./cost-meter-sidebar"
import { ShiftDialog } from "./shift-dialog"
import type { EmployeeWithRoles } from "@/lib/dal/employees"
import type { ShiftRow } from "@/lib/dal/shifts"
import type { Store } from "@/lib/dal/stores"

interface ScheduleBuilderProps {
  employees: EmployeeWithRoles[]
  initialShifts: ShiftRow[]
  store: Store
  weekStart: string
}

export function ScheduleBuilder({
  employees,
  initialShifts,
  store,
  weekStart,
}: ScheduleBuilderProps) {
  const [shifts, setShifts] = useState<ShiftRow[]>(initialShifts)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftRow | null>(null)
  const [prefilledDay, setPrefilledDay] = useState<string | null>(null)
  const [prefilledEmployeeId, setPrefilledEmployeeId] = useState<number | null>(null)
  const [mobileCostOpen, setMobileCostOpen] = useState(false)

  // Reset shifts when week changes (navigation)
  useEffect(() => {
    setShifts(initialShifts)
  }, [initialShifts])

  const weekStartDate = useMemo(() => parseISO(weekStart), [weekStart])
  const weekDays = useMemo(() => getWeekDays(weekStartDate), [weekStartDate])
  const weekLabel = useMemo(() => formatWeekLabel(weekStartDate), [weekStartDate])

  const costs = useMemo(
    () =>
      calculateWeekCosts(
        shifts,
        employees.map((e) => ({
          id: e.id,
          hourlyRate: e.hourlyRate,
          name: e.name,
        })),
        Number(store.weeklyBudget)
      ),
    [shifts, employees, store.weeklyBudget]
  )

  const handleCellClick = useCallback(
    (employeeId: number, date: string) => {
      setPrefilledDay(date)
      setPrefilledEmployeeId(employeeId)
      setEditingShift(null)
      setDialogOpen(true)
    },
    []
  )

  const handleShiftClick = useCallback((shift: ShiftRow) => {
    setEditingShift(shift)
    setPrefilledDay(null)
    setPrefilledEmployeeId(null)
    setDialogOpen(true)
  }, [])

  const handleCreateShift = useCallback(
    async (data: {
      employeeId: number | null
      date: string
      startTime: string
      endTime: string
      roleName: "cashier" | "stock" | "manager" | "visual_merch"
      breakMinutes: number
    }) => {
      // Optimistic: add temp shift
      const tempId = -Date.now()
      const tempShift: ShiftRow = {
        id: tempId,
        employeeId: data.employeeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        roleName: data.roleName as ShiftRow["roleName"],
        breakMinutes: data.breakMinutes,
        status: data.employeeId ? "assigned" : "open",
        storeId: store.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setShifts((prev) => [...prev, tempShift])
      setDialogOpen(false)

      const result = await createShift(data)
      if (result.success && result.shift) {
        setShifts((prev) =>
          prev.map((s) => (s.id === tempId ? result.shift! : s))
        )
        toast.success("Shift created")
      } else {
        setShifts((prev) => prev.filter((s) => s.id !== tempId))
        toast.error(result.message || "Failed to create shift")
      }
    },
    [store.id]
  )

  const handleUpdateShift = useCallback(
    async (
      shiftId: number,
      data: {
        employeeId: number | null
        date: string
        startTime: string
        endTime: string
        roleName: "cashier" | "stock" | "manager" | "visual_merch"
        breakMinutes: number
      }
    ) => {
      // Optimistic: update in-place
      const previous = shifts.find((s) => s.id === shiftId)
      if (!previous) return

      setShifts((prev) =>
        prev.map((s) =>
          s.id === shiftId
            ? {
                ...s,
                ...data,
                roleName: data.roleName as ShiftRow["roleName"],
                status: data.employeeId ? "assigned" : "open",
                updatedAt: new Date(),
              }
            : s
        )
      )
      setDialogOpen(false)

      const result = await updateShift(shiftId, data)
      if (result.success) {
        toast.success("Shift updated")
      } else {
        setShifts((prev) =>
          prev.map((s) => (s.id === shiftId ? previous : s))
        )
        toast.error(result.message || "Failed to update shift")
      }
    },
    [shifts]
  )

  const handleDeleteShift = useCallback(
    async (shiftId: number) => {
      const previous = shifts.find((s) => s.id === shiftId)
      if (!previous) return

      setShifts((prev) => prev.filter((s) => s.id !== shiftId))
      setDialogOpen(false)

      const result = await deleteShift(shiftId)
      if (result.success) {
        toast.success("Shift deleted")
      } else {
        setShifts((prev) => [...prev, previous])
        toast.error(result.message || "Failed to delete shift")
      }
    },
    [shifts]
  )

  const prevWeekStr = format(getPrevWeek(weekStartDate), "yyyy-MM-dd")
  const nextWeekStr = format(getNextWeek(weekStartDate), "yyyy-MM-dd")

  return (
    <div className="space-y-4">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
          <p className="text-sm text-gray-500">{store.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/schedule?week=${prevWeekStr}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </a>
          <span className="min-w-[200px] text-center text-sm font-medium text-gray-700">
            {weekLabel}
          </span>
          <a
            href={`/schedule?week=${nextWeekStr}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Mobile cost summary bar */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileCostOpen(!mobileCostOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-900">
              ${costs.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
            <span
              className={`text-xs font-medium ${
                costs.budgetPercent > 100
                  ? "text-red-600"
                  : costs.budgetPercent >= 80
                    ? "text-amber-600"
                    : "text-green-600"
              }`}
            >
              {costs.budgetPercent.toFixed(0)}% of budget
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {mobileCostOpen ? "Hide" : "Show"} details
          </span>
        </button>
        {mobileCostOpen && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
            <CostMeterSidebar
              costs={costs}
              employees={employees}
              budget={Number(store.weeklyBudget)}
              weekDays={weekDays}
            />
          </div>
        )}
      </div>

      {/* Main layout: grid + sidebar */}
      <div className="flex gap-6">
        {/* Schedule Grid */}
        <div className="min-w-0 flex-1">
          <ScheduleGrid
            shifts={shifts}
            employees={employees}
            weekStart={weekStart}
            onCellClick={handleCellClick}
            onShiftClick={handleShiftClick}
          />
        </div>

        {/* Cost Meter Sidebar (desktop only) */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-0 rounded-lg border border-gray-200 bg-white p-4">
            <CostMeterSidebar
              costs={costs}
              employees={employees}
              budget={Number(store.weeklyBudget)}
              weekDays={weekDays}
            />
          </div>
        </div>
      </div>

      {/* Shift Dialog */}
      <ShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingShift={editingShift}
        prefilledDay={prefilledDay}
        prefilledEmployeeId={prefilledEmployeeId}
        employees={employees}
        store={store}
        onSave={(data) => {
          if (editingShift) {
            handleUpdateShift(editingShift.id, data)
          } else {
            handleCreateShift(data)
          }
        }}
        onDelete={handleDeleteShift}
      />
    </div>
  )
}
