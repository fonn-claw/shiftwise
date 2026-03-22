"use client"

import { format, isToday } from "date-fns"

interface DailyBreakdownProps {
  dailyCosts: Record<string, number>
  dailyHours: Record<string, number>
  weekDays: Date[]
}

export function DailyBreakdown({
  dailyCosts,
  dailyHours,
  weekDays,
}: DailyBreakdownProps) {
  return (
    <div className="space-y-1">
      {weekDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const hours = dailyHours[dateStr] || 0
        const cost = dailyCosts[dateStr] || 0
        const today = isToday(day)

        return (
          <div
            key={dateStr}
            className={`grid grid-cols-3 items-center rounded px-2 py-1.5 text-sm ${
              today ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700"
            }`}
          >
            <span className="text-xs font-medium">
              {format(day, "EEE")}
            </span>
            <span className="text-right text-xs">
              {hours.toFixed(1)}h
            </span>
            <span className="text-right text-xs font-medium">
              ${cost.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
