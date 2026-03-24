"use client"

import { useState, useMemo } from "react"
import {
  History,
  Plus,
  Pencil,
  Trash2,
  ArrowLeftRight,
  Check,
  X,
  Hand,
  Copy,
  MoveHorizontal,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AuditEntry } from "@/lib/dal/compliance"
import { format } from "date-fns"

interface AuditLogProps {
  initialEntries: AuditEntry[]
  totalCount: number
}

const ACTION_MAP: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "shift.created": { label: "Shift Created", icon: Plus },
  "shift.updated": { label: "Shift Updated", icon: Pencil },
  "shift.deleted": { label: "Shift Deleted", icon: Trash2 },
  "shift.moved": { label: "Shift Moved", icon: MoveHorizontal },
  "swap.requested": { label: "Swap Requested", icon: ArrowLeftRight },
  "swap.approved": { label: "Swap Approved", icon: Check },
  "swap.rejected": { label: "Swap Rejected", icon: X },
  "pickup.requested": { label: "Pickup Requested", icon: Hand },
  "pickup.approved": { label: "Pickup Approved", icon: Check },
  "schedule.copied": { label: "Schedule Copied", icon: Copy },
}

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "shift.created", label: "Shift Created" },
  { value: "shift.updated", label: "Shift Updated" },
  { value: "shift.deleted", label: "Shift Deleted" },
  { value: "shift.moved", label: "Shift Moved" },
  { value: "swap.requested", label: "Swap Requested" },
  { value: "swap.approved", label: "Swap Approved" },
  { value: "swap.rejected", label: "Swap Rejected" },
  { value: "pickup.requested", label: "Pickup Requested" },
  { value: "pickup.approved", label: "Pickup Approved" },
  { value: "schedule.copied", label: "Schedule Copied" },
]

function renderDetails(details: Record<string, unknown>): string {
  const parts: string[] = []
  if (details.employeeName) parts.push(String(details.employeeName))
  if (details.date) parts.push(String(details.date))
  if (details.startTime && details.endTime)
    parts.push(`${details.startTime}-${details.endTime}`)
  if (details.role) parts.push(String(details.role))
  if (details.reason) parts.push(String(details.reason))
  if (details.fromDate && details.toDate)
    parts.push(`${details.fromDate} -> ${details.toDate}`)

  if (parts.length === 0) {
    // Fallback: show first few key-value pairs
    const entries = Object.entries(details).slice(0, 3)
    for (const [k, v] of entries) {
      parts.push(`${k}: ${String(v)}`)
    }
  }

  return parts.join(" | ")
}

export function AuditLog({ initialEntries, totalCount }: AuditLogProps) {
  const [actionFilter, setActionFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    let entries = initialEntries

    if (actionFilter !== "all") {
      entries = entries.filter((e) => e.action === actionFilter)
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      entries = entries.filter((e) => new Date(e.createdAt) >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      entries = entries.filter((e) => new Date(e.createdAt) <= to)
    }

    return entries
  }, [initialEntries, actionFilter, dateFrom, dateTo])

  function clearFilters() {
    setActionFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters =
    actionFilter !== "all" || dateFrom !== "" || dateTo !== ""

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            Audit Log
          </span>
          <span className="text-sm font-normal text-gray-400">
            {totalCount} total entries
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={actionFilter}
            onValueChange={(v) => setActionFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]" data-testid="compliance-log-filter">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px]"
            placeholder="From date"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px]"
            placeholder="To date"
          />

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        {/* Entries */}
        <div className="max-h-[600px] space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No audit entries found
              {hasActiveFilters && " matching your filters"}
            </div>
          ) : (
            filtered.map((entry) => {
              const actionInfo = ACTION_MAP[entry.action]
              const Icon = actionInfo?.icon ?? History
              const label = actionInfo?.label ?? entry.action

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-gray-50"
                >
                  <div className="mt-0.5 rounded bg-gray-100 p-1.5">
                    <Icon className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {label}
                      </span>
                      {entry.userName && (
                        <span className="text-xs text-gray-500">
                          by {entry.userName}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {renderDetails(entry.details)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
