"use client"

import { CheckCircle2, AlertTriangle, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ComplianceStatus } from "@/lib/dal/compliance"

interface ComplianceStatusCardsProps {
  status: ComplianceStatus
}

function WeekCard({
  label,
  week,
}: {
  label: string
  week: ComplianceStatus["currentWeek"]
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium text-gray-900">{week.weekLabel}</p>

        <div className="flex items-center gap-2">
          {week.isCompliant ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Compliant
              </Badge>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <Badge
                variant="outline"
                className="border-red-200 bg-red-50 text-red-700"
              >
                Non-Compliant
              </Badge>
            </>
          )}
        </div>

        <p className="text-sm text-gray-600">
          {week.daysNotice} days notice (required: {week.requiredDays})
        </p>
        <p className="text-sm text-gray-500">
          {week.shiftCount} shifts scheduled
        </p>
      </CardContent>
    </Card>
  )
}

export function ComplianceStatusCards({ status }: ComplianceStatusCardsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <WeekCard label="Current Week" week={status.currentWeek} />
        <WeekCard label="Next Week" week={status.nextWeek} />
      </div>

      <Card className="border-indigo-100 bg-indigo-50/50">
        <CardContent className="flex items-start gap-3 pt-4">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
          <div>
            <p className="text-sm font-semibold text-indigo-900">
              {status.rule.name}
            </p>
            <p className="text-sm text-indigo-700">{status.rule.description}</p>
            <p className="mt-1 text-xs text-indigo-600">
              Required notice period: {status.rule.noticePeriodDays} days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
