"use client"

import { ROLE_COLORS } from "@/lib/constants"
import { formatTime } from "@/lib/utils/schedule-helpers"
import type { ShiftRow } from "@/lib/dal/shifts"

interface ShiftCardProps {
  shift: ShiftRow
  onClick: () => void
}

export function ShiftCard({ shift, onClick }: ShiftCardProps) {
  const color = ROLE_COLORS[shift.roleName as keyof typeof ROLE_COLORS]
  const isOpen = shift.status === "open"

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`mb-1 w-full rounded-md px-2 py-1 text-left text-xs transition-shadow hover:ring-2 hover:ring-indigo-300 ${
        isOpen
          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          : `${color?.bg ?? "bg-gray-100"} ${color?.text ?? "text-gray-700"}`
      }`}
    >
      <div className="font-medium">
        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
      </div>
      <div className="mt-0.5 flex items-center gap-1">
        {isOpen ? (
          <span className="inline-block rounded bg-amber-200 px-1 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
            Open
          </span>
        ) : (
          <span
            className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium ${color?.bg ?? "bg-gray-100"} ${color?.text ?? "text-gray-700"}`}
          >
            {color?.label ?? shift.roleName}
          </span>
        )}
      </div>
    </button>
  )
}
