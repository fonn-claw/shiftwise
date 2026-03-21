import { auth } from "@/lib/auth"
import { getEmployees } from "@/lib/dal/employees"
import { EmployeeTable } from "@/components/employees/employee-table"

export default async function EmployeesPage() {
  const session = await auth()
  const employees = await getEmployees()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
        <p className="text-sm text-gray-500">Manage your team</p>
      </div>

      <EmployeeTable
        employees={JSON.parse(JSON.stringify(employees))}
        userRole={session?.user?.role ?? "employee"}
      />
    </div>
  )
}
