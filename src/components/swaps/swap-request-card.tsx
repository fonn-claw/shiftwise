"use client"

import { format, parseISO } from "date-fns"
import { ArrowLeftRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROLE_COLORS } from "@/lib/constants"
import { formatTime } from "@/lib/utils/schedule-helpers"
import { calculateShiftHours } from "@/lib/utils/cost-calculator"
import type { SwapRequestRow } from "@/lib/dal/swaps"

interface SwapRequestCardProps {
  swap: SwapRequestRow
  userRole: string
  userId: number
  requestorWeekHours?: number
  targetWeekHours?: number
  onApprove: (swapId: number) => void
  onReject: (swapId: number) => void
  onCancel: (swapId: number) => void
  isPending?: boolean
}

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
} as const

function ShiftInfo({
  label,
  date,
  startTime,
  endTime,
  roleName,
}: {
  label: string
  date: string
  startTime: string
  endTime: string
  roleName: string
}) {
  const color = ROLE_COLORS[roleName as keyof typeof ROLE_COLORS]

  return (
    <div className="flex-1 rounded-lg bg-gray-50 p-3">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {format(parseISO(date), "EEE, MMM d")}
      </p>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
        <Clock className="h-3 w-3" />
        {formatTime(startTime)} - {formatTime(endTime)}
      </div>
      <span
        className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${color?.bg ?? "bg-gray-100"} ${color?.text ?? "text-gray-700"}`}
      >
        {color?.label ?? roleName}
      </span>
    </div>
  )
}

export function SwapRequestCard({
  swap,
  userRole,
  userId,
  requestorWeekHours,
  targetWeekHours,
  onApprove,
  onReject,
  onCancel,
  isPending,
}: SwapRequestCardProps) {
  const isRequestor = userId === swap.requestor.id
  const canApproveReject =
    swap.status === "pending" &&
    (userRole === "manager" || userRole === "supervisor")
  const canCancel = swap.status === "pending" && isRequestor

  // Calculate projected hours after swap
  const reqShiftHours = calculateShiftHours(
    swap.requestorShift.startTime,
    swap.requestorShift.endTime,
    swap.requestorShift.breakMinutes
  )
  const tgtShiftHours = calculateShiftHours(
    swap.targetShift.startTime,
    swap.targetShift.endTime,
    swap.targetShift.breakMinutes
  )

  const reqCurrentHours = requestorWeekHours ?? 0
  const tgtCurrentHours = targetWeekHours ?? 0
  const reqProjected = reqCurrentHours - reqShiftHours + tgtShiftHours
  const tgtProjected = tgtCurrentHours - tgtShiftHours + reqShiftHours

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {swap.requestor.name}
            </span>
            <ArrowLeftRight className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">
              {swap.targetEmployee.name}
            </span>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[swap.status]}`}
          >
            {swap.status}
          </span>
        </div>

        {/* Shifts side-by-side */}
        <div className="flex items-center gap-2">
          <ShiftInfo
            label={swap.requestor.name}
            date={swap.requestorShift.date}
            startTime={swap.requestorShift.startTime}
            endTime={swap.requestorShift.endTime}
            roleName={swap.requestorShift.roleName}
          />
          <div className="flex-shrink-0">
            <ArrowLeftRight className="h-5 w-5 text-indigo-400" />
          </div>
          <ShiftInfo
            label={swap.targetEmployee.name}
            date={swap.targetShift.date}
            startTime={swap.targetShift.startTime}
            endTime={swap.targetShift.endTime}
            roleName={swap.targetShift.roleName}
          />
        </div>

        {/* Hours impact */}
        {(requestorWeekHours !== undefined ||
          targetWeekHours !== undefined) && (
          <p className="text-xs text-gray-500">
            <span className="font-medium">{swap.requestor.name}:</span>{" "}
            {reqCurrentHours}h &rarr; {Math.round(reqProjected * 10) / 10}h
            {" | "}
            <span className="font-medium">{swap.targetEmployee.name}:</span>{" "}
            {tgtCurrentHours}h &rarr; {Math.round(tgtProjected * 10) / 10}h
          </p>
        )}

        {/* Rejection reason */}
        {swap.status === "rejected" && swap.reason && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
            {swap.reason}
          </p>
        )}

        {/* Action buttons */}
        {(canApproveReject || canCancel) && (
          <div className="flex items-center gap-2 pt-1">
            {canApproveReject && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove(swap.id)}
                  disabled={isPending}
                  data-testid="swap-approve-btn"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(swap.id)}
                  disabled={isPending}
                  data-testid="swap-reject-btn"
                >
                  Reject
                </Button>
              </>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(swap.id)}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
