"use client"

import {
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  UserX,
  ArrowRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Line,
  ComposedChart,
} from "recharts"
import { ROLE_COLORS } from "@/lib/constants"
import type {
  TodayShift,
  EmployeeWeekSummary,
  WeekCostPoint,
} from "@/lib/dal/dashboard"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TeamDashboardProps {
  todayShifts: TodayShift[]
  weekSummary: EmployeeWeekSummary[]
  historicalCosts: WeekCostPoint[]
  storeName: string
  weeklyBudget: number
  todayDate: string
}

// ---------------------------------------------------------------------------
// Chart config
// ---------------------------------------------------------------------------

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`
}

const costChartConfig = {
  totalCost: {
    label: "Labor Cost",
    color: "oklch(0.541 0.221 264)",
  },
  budget: {
    label: "Budget",
    color: "oklch(0.577 0.245 27.325)",
  },
} satisfies ChartConfig

const hoursChartConfig = {
  totalHours: {
    label: "Hours",
    color: "oklch(0.541 0.221 264)",
  },
} satisfies ChartConfig

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamDashboard({
  todayShifts,
  weekSummary,
  historicalCosts,
  storeName,
  weeklyBudget,
  todayDate,
}: TeamDashboardProps) {
  const workingNow = todayShifts.filter((s) => s.status === "working")
  const upcoming = todayShifts.filter((s) => s.status === "upcoming")
  const completed = todayShifts.filter((s) => s.status === "completed")
  const overtimeRisks = weekSummary.filter((e) => e.overtimeLevel !== "none")

  const currentWeekCost =
    historicalCosts.length > 0
      ? historicalCosts[historicalCosts.length - 1].totalCost
      : 0
  const currentWeekHours =
    historicalCosts.length > 0
      ? historicalCosts[historicalCosts.length - 1].totalHours
      : 0
  const budgetPercent =
    weeklyBudget > 0 ? (currentWeekCost / weeklyBudget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Team Dashboard</h2>
        <p className="text-sm text-gray-500">
          {storeName} &mdash;{" "}
          {new Date(todayDate + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Working Now"
          value={workingNow.length}
          subtitle={`of ${todayShifts.length} today`}
          icon={<UserCheck className="h-5 w-5 text-green-600" />}
          accent="bg-green-50"
        />
        <SummaryCard
          title="Coming In"
          value={upcoming.length}
          subtitle="shifts remaining"
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-50"
        />
        <SummaryCard
          title="Weekly Cost"
          value={`$${currentWeekCost.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle={`${budgetPercent.toFixed(0)}% of $${(weeklyBudget / 1000).toFixed(0)}K budget`}
          icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
          accent="bg-indigo-50"
        />
        <SummaryCard
          title="Overtime Risks"
          value={overtimeRisks.length}
          subtitle={
            overtimeRisks.length > 0
              ? `${overtimeRisks.filter((e) => e.overtimeLevel === "red").length} over 40h`
              : "all clear"
          }
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          accent="bg-amber-50"
        />
      </div>

      {/* Today's shifts + Week overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's view */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Today&apos;s Schedule
            </CardTitle>
            <CardDescription>
              {todayShifts.length} shifts scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayShifts.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                No shifts scheduled today
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {todayShifts.map((shift) => (
                  <TodayShiftRow key={shift.id} shift={shift} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee hours this week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Week Overview
            </CardTitle>
            <CardDescription>
              Hours per employee &mdash; {currentWeekHours.toFixed(1)}h total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weekSummary.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                No shifts this week
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {weekSummary.map((emp) => (
                  <EmployeeHoursRow key={emp.employeeId} employee={emp} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical labor cost trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Labor Cost Trends
          </CardTitle>
          <CardDescription>
            Last 4 weeks &mdash; budget: $
            {weeklyBudget.toLocaleString("en-US")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={costChartConfig} className="h-64 w-full">
            <ComposedChart data={historicalCosts}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="weekLabel" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const v = Number(value)
                      if (name === "budget")
                        return [`$${v.toLocaleString()}`, "Budget"]
                      return [`$${v.toLocaleString()}`, "Labor Cost"]
                    }}
                  />
                }
              />
              <Bar
                dataKey="totalCost"
                fill="var(--color-totalCost)"
                radius={[4, 4, 0, 0]}
              />
              <ReferenceLine
                y={weeklyBudget}
                stroke="oklch(0.577 0.245 27.325)"
                strokeDasharray="4 4"
                label={{
                  value: "Budget",
                  position: "right",
                  fill: "oklch(0.577 0.245 27.325)",
                  fontSize: 12,
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <Card>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${accent}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="truncate text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TodayShiftRow({ shift }: { shift: TodayShift }) {
  const roleColor = ROLE_COLORS[shift.roleName]
  const statusConfig = {
    working: {
      label: "Working",
      className: "bg-green-100 text-green-700",
    },
    upcoming: {
      label: "Upcoming",
      className: "bg-blue-100 text-blue-700",
    },
    completed: {
      label: "Done",
      className: "bg-gray-100 text-gray-600",
    },
  }
  const status = statusConfig[shift.status]

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${roleColor.bg} ${roleColor.text}`}
        >
          {shift.employeeName
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {shift.employeeName}
          </p>
          <p className="text-xs text-gray-500">
            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColor.bg} ${roleColor.text}`}
        >
          {roleColor.label}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </div>
  )
}

function EmployeeHoursRow({ employee }: { employee: EmployeeWeekSummary }) {
  const pct = Math.min((employee.totalHours / employee.maxHours) * 100, 100)
  const barColor =
    employee.overtimeLevel === "red"
      ? "bg-red-500"
      : employee.overtimeLevel === "amber"
        ? "bg-amber-500"
        : "bg-indigo-500"

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900">
          {employee.employeeName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">
            {employee.totalHours.toFixed(1)}h / {employee.maxHours}h
          </span>
          {employee.overtimeLevel !== "none" && (
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                employee.overtimeLevel === "red"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {employee.overtimeLevel === "red" ? "OT" : "Near OT"}
            </span>
          )}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
