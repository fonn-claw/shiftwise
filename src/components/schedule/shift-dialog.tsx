"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLE_COLORS } from "@/lib/constants"
import { getTimeOptions, formatTime } from "@/lib/utils/schedule-helpers"
import type { EmployeeWithRoles } from "@/lib/dal/employees"
import type { ShiftRow } from "@/lib/dal/shifts"
import type { Store } from "@/lib/dal/stores"

interface ShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingShift: ShiftRow | null
  prefilledDay: string | null
  prefilledEmployeeId: number | null
  employees: EmployeeWithRoles[]
  store: Store
  onSave: (data: {
    employeeId: number | null
    date: string
    startTime: string
    endTime: string
    roleName: "cashier" | "stock" | "manager" | "visual_merch"
    breakMinutes: number
  }) => void
  onDelete: (shiftId: number) => void
}

const roleOptions = Object.entries(ROLE_COLORS).map(([key, val]) => ({
  value: key,
  label: val.label,
}))

export function ShiftDialog({
  open,
  onOpenChange,
  editingShift,
  prefilledDay,
  prefilledEmployeeId,
  employees,
  store,
  onSave,
  onDelete,
}: ShiftDialogProps) {
  const timeOptions = getTimeOptions(store.openTime, store.closeTime)

  const [employeeId, setEmployeeId] = useState<string>("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [roleName, setRoleName] = useState("")
  const [breakMinutes, setBreakMinutes] = useState(0)
  const [error, setError] = useState("")

  // Reset form when dialog opens/editing changes
  useEffect(() => {
    if (!open) return

    if (editingShift) {
      setEmployeeId(
        editingShift.employeeId ? String(editingShift.employeeId) : ""
      )
      setDate(editingShift.date)
      setStartTime(editingShift.startTime)
      setEndTime(editingShift.endTime)
      setRoleName(editingShift.roleName)
      setBreakMinutes(editingShift.breakMinutes)
    } else {
      setEmployeeId(prefilledEmployeeId ? String(prefilledEmployeeId) : "")
      setDate(prefilledDay || "")
      setStartTime(timeOptions[0] || "09:00")
      setEndTime(timeOptions[Math.min(12, timeOptions.length - 1)] || "15:00")
      setRoleName("cashier")
      setBreakMinutes(0)
    }
    setError("")
  }, [open, editingShift, prefilledDay, prefilledEmployeeId, timeOptions])

  const handleSave = () => {
    if (endTime <= startTime) {
      setError("End time must be after start time")
      return
    }
    if (!date) {
      setError("Date is required")
      return
    }

    onSave({
      employeeId: employeeId ? Number(employeeId) : null,
      date,
      startTime,
      endTime,
      roleName: roleName as "cashier" | "stock" | "manager" | "visual_merch",
      breakMinutes,
    })
  }

  const isEditing = !!editingShift

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Shift" : "Create Shift"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee */}
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee (or leave for open shift)" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={String(emp.id)}>
                    {emp.name} ({emp.jobRoles.map((r) => ROLE_COLORS[r.roleName as keyof typeof ROLE_COLORS]?.label ?? r.roleName).join(", ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={(v) => setStartTime(v ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTime(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Select value={endTime} onValueChange={(v) => setEndTime(v ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTime(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={roleName} onValueChange={(v) => setRoleName(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Break */}
          <div className="space-y-2">
            <Label htmlFor="break">Break Duration (minutes)</Label>
            <Input
              id="break"
              type="number"
              min={0}
              max={120}
              step={15}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={() => onDelete(editingShift!.id)}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? "Update" : "Create"} Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
