import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getEmployees } from "@/lib/dal/employees"
import { EmployeeTable } from "@/components/employees/employee-table"
import { AvailabilityGrid } from "@/components/employees/availability-grid"
import { ROLE_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default async function EmployeesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const employees = await getEmployees()
  const { role, id } = session.user

  // Employee self-view: show own profile card with editable availability
  if (role === "employee") {
    const me = employees[0]
    if (!me) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="text-sm text-gray-500">Your employee information</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            Profile not found
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="text-sm text-gray-500">Your employee information</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
              {me.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{me.name}</h3>
              <p className="text-sm text-gray-500">{me.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Max Hours</p>
              <p className="text-sm font-medium">{me.maxHoursPerWeek} hrs/wk</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
              <p className="text-sm font-medium">{me.phone || "Not set"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Job Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {me.jobRoles.map((jr) => {
                const color = ROLE_COLORS[jr.roleName as keyof typeof ROLE_COLORS]
                return (
                  <span
                    key={jr.roleName}
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      color?.bg ?? "bg-gray-100",
                      color?.text ?? "text-gray-700"
                    )}
                  >
                    {color?.label ?? jr.roleName}
                  </span>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Availability</p>
            <AvailabilityGrid
              userId={me.id}
              availability={me.availability}
              canEdit={true}
            />
          </div>
        </div>
      </div>
    )
  }

  // Manager / Supervisor view: full employee table
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
        <p className="text-sm text-gray-500">Manage your team</p>
      </div>

      <EmployeeTable
        employees={JSON.parse(JSON.stringify(employees))}
        userRole={role}
        currentUserId={id}
      />
    </div>
  )
}
