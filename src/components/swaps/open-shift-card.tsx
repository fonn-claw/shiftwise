"use client"

import { format, parseISO } from "date-fns"
import { Clock, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROLE_COLORS } from "@/lib/constants"
import { formatTime } from "@/lib/utils/schedule-helpers"
import type { OpenShift } from "@/lib/dal/swaps"
import type { PickupRequestRow } from "@/lib/dal/swaps"

interface OpenShiftCardProps {
  shift: OpenShift
  pickupRequests: PickupRequestRow[]
  userRole: string
  onPickup: (shiftId: number) => void
  isPending?: boolean
}

export function OpenShiftCard({
  shift,
  pickupRequests,
  userRole,
  onPickup,
  isPending,
}: OpenShiftCardProps) {
  const color = ROLE_COLORS[shift.roleName as keyof typeof ROLE_COLORS]
  const pendingPickups = pickupRequests.filter(
    (p) => p.shift.id === shift.id && p.status === "pending"
  )

  return (
    <Card size="sm" className="relative">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-2">
            <CalendarDays className="mb-1 h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">
              {format(parseISO(shift.date), "EEE")}
            </span>
            <span className="text-xs text-gray-500">
              {format(parseISO(shift.date), "MMM d")}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${color?.bg ?? "bg-gray-100"} ${color?.text ?? "text-gray-700"}`}
              >
                {color?.label ?? shift.roleName}
              </span>
              {pendingPickups.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {pendingPickups.length} request{pendingPickups.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {userRole === "employee" && (
          <Button
            size="sm"
            onClick={() => onPickup(shift.id)}
            disabled={isPending}
          >
            {isPending ? "Requesting..." : "Pick Up"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
