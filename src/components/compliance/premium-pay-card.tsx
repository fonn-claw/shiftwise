"use client"

import { DollarSign, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PremiumPayEntry } from "@/lib/dal/compliance"
import { formatTime } from "@/lib/utils/schedule-helpers"
import { format } from "date-fns"

interface PremiumPayCardProps {
  entries: PremiumPayEntry[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

const actionLabels: Record<string, string> = {
  "shift.created": "Created",
  "shift.updated": "Updated",
  "shift.deleted": "Deleted",
  "shift.moved": "Moved",
}

export function PremiumPayCard({ entries }: PremiumPayCardProps) {
  const totalPremiumCost = entries.reduce((sum, e) => sum + e.premiumCost, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-gray-500" />
          Premium Pay Exposure
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-emerald-700">
              No premium pay triggered
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Total Premium Pay
              </p>
              <p className="text-2xl font-bold text-amber-900">
                {formatCurrency(totalPremiumCost)}
              </p>
            </div>

            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.auditId}
                  className="rounded-md border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.employeeName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {actionLabels[entry.action] ?? entry.action}
                      </Badge>
                    </div>
                    <span className="text-sm font-semibold text-amber-700">
                      {formatCurrency(entry.premiumCost)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {format(new Date(entry.shiftDate), "MMM d, yyyy")}
                    </span>
                    <span>{formatTime(entry.shiftTime)}</span>
                    <span>
                      {entry.premiumHours}h premium @{" "}
                      {formatCurrency(entry.hourlyRate)}/hr
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-gray-400">{entry.rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
