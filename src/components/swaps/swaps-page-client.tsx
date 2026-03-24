"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ArrowLeftRight, CalendarCheck, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OpenShiftCard } from "./open-shift-card"
import { SwapRequestCard } from "./swap-request-card"
import { Card, CardContent } from "@/components/ui/card"
import { ROLE_COLORS } from "@/lib/constants"
import { formatTime } from "@/lib/utils/schedule-helpers"
import { format, parseISO } from "date-fns"
import {
  approveSwap,
  rejectSwap,
  cancelSwap,
} from "@/lib/actions/swaps"
import {
  createPickupRequest,
  approvePickup,
  rejectPickup,
} from "@/lib/actions/pickups"
import type { OpenShift, SwapRequestRow, PickupRequestRow } from "@/lib/dal/swaps"

interface SwapsPageClientProps {
  openShifts: OpenShift[]
  swapRequests: SwapRequestRow[]
  pickupRequests: PickupRequestRow[]
  userRole: string
  userId: number
  employeeWeekHours?: Record<number, number>
}

type TabValue = "pending" | "all"

export function SwapsPageClient({
  openShifts: initialOpenShifts,
  swapRequests: initialSwaps,
  pickupRequests: initialPickups,
  userRole,
  userId,
  employeeWeekHours = {},
}: SwapsPageClientProps) {
  const [openShifts] = useState(initialOpenShifts)
  const [swaps, setSwaps] = useState(initialSwaps)
  const [pickups, setPickups] = useState(initialPickups)
  const [activeTab, setActiveTab] = useState<TabValue>("pending")
  const [isPending, startTransition] = useTransition()

  // ---- Pickup handlers ----

  function handlePickup(shiftId: number) {
    startTransition(async () => {
      const result = await createPickupRequest({ shiftId })
      if (result.success) {
        toast.success("Pickup request submitted!")
      } else {
        toast.error(result.message ?? "Failed to request pickup")
      }
    })
  }

  function handleApprovePickup(pickupId: number) {
    const prev = [...pickups]
    setPickups((p) =>
      p.map((pk) => (pk.id === pickupId ? { ...pk, status: "approved" as const } : pk))
    )
    startTransition(async () => {
      const result = await approvePickup(pickupId)
      if (result.success) {
        toast.success("Pickup approved!")
      } else {
        setPickups(prev)
        toast.error(result.message ?? "Failed to approve pickup")
      }
    })
  }

  function handleRejectPickup(pickupId: number) {
    const prev = [...pickups]
    setPickups((p) =>
      p.map((pk) => (pk.id === pickupId ? { ...pk, status: "rejected" as const } : pk))
    )
    startTransition(async () => {
      const result = await rejectPickup(pickupId)
      if (result.success) {
        toast.success("Pickup rejected")
      } else {
        setPickups(prev)
        toast.error(result.message ?? "Failed to reject pickup")
      }
    })
  }

  // ---- Swap handlers ----

  function handleApproveSwap(swapId: number) {
    const prev = [...swaps]
    setSwaps((s) =>
      s.map((sw) => (sw.id === swapId ? { ...sw, status: "approved" as const } : sw))
    )
    startTransition(async () => {
      const result = await approveSwap(swapId)
      if (result.success) {
        toast.success("Swap approved!")
      } else {
        setSwaps(prev)
        toast.error(result.message ?? "Failed to approve swap")
      }
    })
  }

  function handleRejectSwap(swapId: number) {
    const prev = [...swaps]
    setSwaps((s) =>
      s.map((sw) => (sw.id === swapId ? { ...sw, status: "rejected" as const } : sw))
    )
    startTransition(async () => {
      const result = await rejectSwap(swapId)
      if (result.success) {
        toast.success("Swap rejected")
      } else {
        setSwaps(prev)
        toast.error(result.message ?? "Failed to reject swap")
      }
    })
  }

  function handleCancelSwap(swapId: number) {
    const prev = [...swaps]
    setSwaps((s) =>
      s.map((sw) =>
        sw.id === swapId
          ? { ...sw, status: "rejected" as const, reason: "Cancelled by requestor" }
          : sw
      )
    )
    startTransition(async () => {
      const result = await cancelSwap(swapId)
      if (result.success) {
        toast.success("Swap request cancelled")
      } else {
        setSwaps(prev)
        toast.error(result.message ?? "Failed to cancel swap")
      }
    })
  }

  // ---- Filtered data ----

  const filteredSwaps =
    activeTab === "pending"
      ? swaps.filter((s) => s.status === "pending")
      : swaps

  const filteredPickups =
    activeTab === "pending"
      ? pickups.filter((p) => p.status === "pending")
      : pickups

  return (
    <div className="space-y-8">
      {/* Open Shifts Section */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <CalendarCheck className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">Open Shifts</h3>
          {openShifts.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {openShifts.length}
            </span>
          )}
        </div>

        {openShifts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
            <CalendarCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">No open shifts right now</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openShifts.map((shift) => (
              <OpenShiftCard
                key={shift.id}
                shift={shift}
                pickupRequests={pickups}
                userRole={userRole}
                onPickup={handlePickup}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Swap & Pickup Requests Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900">Requests</h3>
          </div>

          {/* Tab buttons */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              data-testid="swap-filter-pending"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "pending"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              data-testid="swap-filter-all"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Swap Requests */}
        {filteredSwaps.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
              <ArrowLeftRight className="h-4 w-4" />
              Shift Swaps
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {filteredSwaps.length}
              </span>
            </h4>
            <div className="grid gap-3">
              {filteredSwaps.map((swap) => (
                <SwapRequestCard
                  key={swap.id}
                  swap={swap}
                  userRole={userRole}
                  userId={userId}
                  requestorWeekHours={employeeWeekHours[swap.requestor.id]}
                  targetWeekHours={employeeWeekHours[swap.targetEmployee.id]}
                  onApprove={handleApproveSwap}
                  onReject={handleRejectSwap}
                  onCancel={handleCancelSwap}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pickup Requests */}
        {filteredPickups.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
              <Package className="h-4 w-4" />
              Pickup Requests
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {filteredPickups.length}
              </span>
            </h4>
            <div className="grid gap-3">
              {filteredPickups.map((pickup) => {
                const color =
                  ROLE_COLORS[
                    pickup.shift.roleName as keyof typeof ROLE_COLORS
                  ]
                const statusStyle =
                  pickup.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : pickup.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"

                const canApprove =
                  pickup.status === "pending" &&
                  (userRole === "manager" || userRole === "supervisor")

                return (
                  <Card key={pickup.id} size="sm">
                    <CardContent className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {pickup.employee.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {format(parseISO(pickup.shift.date), "EEE, MMM d")}{" "}
                            &middot;{" "}
                            {formatTime(pickup.shift.startTime)} -{" "}
                            {formatTime(pickup.shift.endTime)}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${color?.bg ?? "bg-gray-100"} ${color?.text ?? "text-gray-700"}`}
                            >
                              {color?.label ?? pickup.shift.roleName}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyle}`}
                            >
                              {pickup.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canApprove && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprovePickup(pickup.id)}
                            disabled={isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectPickup(pickup.id)}
                            disabled={isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredSwaps.length === 0 && filteredPickups.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
            <ArrowLeftRight className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              {activeTab === "pending"
                ? "No pending requests"
                : "No swap or pickup requests yet"}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
