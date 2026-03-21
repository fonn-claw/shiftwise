"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLE_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { EmployeePanel } from "@/components/employees/employee-panel"

interface EmployeeRole {
  id: number
  userId: number
  roleName: "cashier" | "stock" | "manager" | "visual_merch"
}

interface EmployeeAvailability {
  id: number
  userId: number
  dayOfWeek: number
  isAvailable: boolean
}

interface Employee {
  id: number
  name: string
  email: string
  role: "manager" | "supervisor" | "employee"
  hourlyRate: string
  maxHoursPerWeek: number
  phone: string | null
  isActive: boolean
  jobRoles: EmployeeRole[]
  availability: EmployeeAvailability[]
}

type SortColumn = "name" | "rate" | "maxHours" | "status"
type SortDirection = "asc" | "desc"

interface EmployeeTableProps {
  employees: Employee[]
  userRole: string
  currentUserId: string
}

function formatAvailability(avail: EmployeeAvailability[]): string {
  const available = avail
    .filter((a) => a.isAvailable)
    .map((a) => a.dayOfWeek)
    .sort()

  if (available.length === 0) return "None"
  if (available.length === 7) return "Any day"

  const dayAbbrevs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const ranges: string[] = []
  let rangeStart = available[0]
  let rangeEnd = available[0]

  for (let i = 1; i < available.length; i++) {
    if (available[i] === rangeEnd + 1) {
      rangeEnd = available[i]
    } else {
      ranges.push(
        rangeStart === rangeEnd
          ? dayAbbrevs[rangeStart]
          : `${dayAbbrevs[rangeStart]}-${dayAbbrevs[rangeEnd]}`
      )
      rangeStart = available[i]
      rangeEnd = available[i]
    }
  }
  ranges.push(
    rangeStart === rangeEnd
      ? dayAbbrevs[rangeStart]
      : `${dayAbbrevs[rangeStart]}-${dayAbbrevs[rangeEnd]}`
  )

  return ranges.join(", ")
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function EmployeeTable({ employees, userRole, currentUserId }: EmployeeTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedEmployees = useMemo(() => {
    const sorted = [...employees].sort((a, b) => {
      let comparison = 0
      switch (sortColumn) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "rate":
          comparison = parseFloat(a.hourlyRate) - parseFloat(b.hourlyRate)
          break
        case "maxHours":
          comparison = a.maxHoursPerWeek - b.maxHoursPerWeek
          break
        case "status":
          comparison = Number(b.isActive) - Number(a.isActive)
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })
    return sorted
  }, [employees, sortColumn, sortDirection])

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3" />
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  function handleRowClick(emp: Employee) {
    setSelectedEmployee(emp)
    setPanelOpen(true)
  }

  function handleAddNew() {
    setSelectedEmployee(null)
    setPanelOpen(true)
  }

  if (employees.length === 0) {
    return (
      <>
        {userRole === "manager" && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={handleAddNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No employees found</p>
        </div>
        <EmployeePanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          employee={selectedEmployee}
          userRole={userRole}
        />
      </>
    )
  }

  return (
    <>
      {userRole === "manager" && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Name
                  <SortIcon column="name" />
                </div>
              </TableHead>
              <TableHead>Role(s)</TableHead>
              {userRole === "manager" && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("rate")}
                >
                  <div className="flex items-center">
                    Hourly Rate
                    <SortIcon column="rate" />
                  </div>
                </TableHead>
              )}
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("maxHours")}
              >
                <div className="flex items-center">
                  Max Hours
                  <SortIcon column="maxHours" />
                </div>
              </TableHead>
              <TableHead>Availability</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon column="status" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEmployees.map((employee) => (
              <TableRow
                key={employee.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(employee)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                      {getInitials(employee.name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {employee.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employee.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {employee.jobRoles.map((jr) => {
                      const color =
                        ROLE_COLORS[jr.roleName as keyof typeof ROLE_COLORS]
                      return (
                        <Badge
                          key={jr.id}
                          className={cn(
                            "text-xs font-medium",
                            color?.bg ?? "bg-gray-100",
                            color?.text ?? "text-gray-700",
                            `hover:${color?.bg ?? "bg-gray-100"}`
                          )}
                        >
                          {color?.label ?? jr.roleName}
                        </Badge>
                      )
                    })}
                  </div>
                </TableCell>
                {userRole === "manager" && (
                  <TableCell className="font-medium">
                    ${parseFloat(employee.hourlyRate).toFixed(2)}/hr
                  </TableCell>
                )}
                <TableCell>{employee.maxHoursPerWeek} hrs/wk</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatAvailability(employee.availability)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs font-medium",
                      employee.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-red-100 text-red-700 hover:bg-red-100"
                    )}
                  >
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EmployeePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        employee={selectedEmployee}
        userRole={userRole}
      />
    </>
  )
}
