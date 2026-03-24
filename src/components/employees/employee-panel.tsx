"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROLE_COLORS } from "@/lib/constants"
import { createEmployee, updateEmployee, type ActionResult } from "@/lib/actions/employees"
import { AvailabilityGrid } from "@/components/employees/availability-grid"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type JobRole = "cashier" | "stock" | "manager" | "visual_merch"

interface Employee {
  id: number
  name: string
  email: string
  role: "manager" | "supervisor" | "employee"
  hourlyRate: string
  maxHoursPerWeek: number
  phone: string | null
  jobRoles: { roleName: JobRole }[]
  availability: { dayOfWeek: number; isAvailable: boolean }[]
}

interface EmployeePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  userRole: string
}

const JOB_ROLES: JobRole[] = ["cashier", "stock", "manager", "visual_merch"]
const SYSTEM_ROLES = ["manager", "supervisor", "employee"] as const

export function EmployeePanel({ open, onOpenChange, employee, userRole }: EmployeePanelProps) {
  const isEdit = !!employee
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [selectedJobRoles, setSelectedJobRoles] = useState<JobRole[]>([])

  useEffect(() => {
    if (employee) {
      setSelectedJobRoles(employee.jobRoles.map((r) => r.roleName))
    } else {
      setSelectedJobRoles([])
    }
    setErrors({})
  }, [employee, open])

  function toggleJobRole(role: JobRole) {
    setSelectedJobRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  function handleSubmit(formData: FormData) {
    // Append job roles to formData
    for (const role of selectedJobRoles) {
      formData.append("jobRoles", role)
    }

    startTransition(async () => {
      let result: ActionResult

      if (isEdit) {
        formData.set("id", String(employee.id))
        result = await updateEmployee(formData)
      } else {
        result = await createEmployee(formData)
      }

      if (result.success) {
        toast.success(isEdit ? "Employee updated" : "Employee created")
        onOpenChange(false)
        setErrors({})
      } else if (result.errors) {
        setErrors(result.errors)
      } else if (result.message) {
        toast.error(result.message)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Employee" : "Add Employee"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update employee details and availability"
              : "Add a new team member"}
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="space-y-5 px-4 pb-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={employee?.name ?? ""}
              placeholder="Full name"
              data-testid="employee-name-input"
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name[0]}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={employee?.email ?? ""}
              placeholder="employee@example.com"
              data-testid="employee-email-input"
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email[0]}</p>
            )}
          </div>

          {/* System Role */}
          <div className="space-y-1.5">
            <Label htmlFor="role">System Role</Label>
            <select
              id="role"
              name="role"
              defaultValue={employee?.role ?? "employee"}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {SYSTEM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-xs text-red-600">{errors.role[0]}</p>
            )}
          </div>

          {/* Job Roles */}
          <div className="space-y-1.5">
            <Label>Job Roles</Label>
            <div className="flex flex-wrap gap-2">
              {JOB_ROLES.map((role) => {
                const colors = ROLE_COLORS[role]
                const isSelected = selectedJobRoles.includes(role)
                return (
                  <button
                    key={role}
                    type="button"
                    data-testid={"role-btn-" + role}
                    onClick={() => toggleJobRole(role)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      isSelected
                        ? `${colors.bg} ${colors.text} border-current`
                        : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {colors.label}
                  </button>
                )
              })}
            </div>
            {errors.jobRoles && (
              <p className="text-xs text-red-600">{errors.jobRoles[0]}</p>
            )}
          </div>

          {/* Hourly Rate */}
          <div className="space-y-1.5">
            <Label htmlFor="hourlyRate">Hourly Rate</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                $
              </span>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={employee?.hourlyRate ?? ""}
                className="pl-7"
                placeholder="15.00"
                data-testid="employee-rate-input"
              />
            </div>
            {errors.hourlyRate && (
              <p className="text-xs text-red-600">{errors.hourlyRate[0]}</p>
            )}
          </div>

          {/* Max Hours/Week */}
          <div className="space-y-1.5">
            <Label htmlFor="maxHoursPerWeek">Max Hours / Week</Label>
            <Input
              id="maxHoursPerWeek"
              name="maxHoursPerWeek"
              type="number"
              min="1"
              max="60"
              required
              defaultValue={employee?.maxHoursPerWeek ?? ""}
              placeholder="40"
              data-testid="employee-hours-input"
            />
            {errors.maxHoursPerWeek && (
              <p className="text-xs text-red-600">{errors.maxHoursPerWeek[0]}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={employee?.phone ?? ""}
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Availability (edit mode only) */}
          {isEdit && employee && (
            <div className="space-y-1.5">
              <Label>Availability</Label>
              <AvailabilityGrid
                userId={employee.id}
                availability={employee.availability}
                canEdit={userRole === "manager"}
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              data-testid="employee-submit-btn"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Update Employee"
                  : "Create Employee"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
