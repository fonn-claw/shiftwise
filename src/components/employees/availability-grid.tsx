"use client"

import { useState, useTransition } from "react"
import { updateAvailability } from "@/lib/actions/employees"
import { DAYS_OF_WEEK } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface AvailabilityGridProps {
  userId: number
  availability: { dayOfWeek: number; isAvailable: boolean }[]
  canEdit: boolean
}

export function AvailabilityGrid({ userId, availability, canEdit }: AvailabilityGridProps) {
  const [localAvail, setLocalAvail] = useState(
    DAYS_OF_WEEK.map((_, i) => {
      const found = availability.find((a) => a.dayOfWeek === i)
      return found ? found.isAvailable : true
    })
  )
  const [isPending, startTransition] = useTransition()

  function handleToggle(dayIndex: number) {
    if (!canEdit) return

    const newValue = !localAvail[dayIndex]

    // Optimistic update
    setLocalAvail((prev) => {
      const next = [...prev]
      next[dayIndex] = newValue
      return next
    })

    startTransition(async () => {
      await updateAvailability(userId, dayIndex, newValue)
    })
  }

  return (
    <div className="flex gap-1.5">
      {DAYS_OF_WEEK.map((day, i) => (
        <button
          key={day}
          type="button"
          disabled={!canEdit || isPending}
          onClick={() => handleToggle(i)}
          className={cn(
            "flex h-8 w-10 items-center justify-center rounded border text-xs font-medium transition-colors",
            localAvail[i]
              ? "border-green-300 bg-green-100 text-green-700"
              : "border-gray-300 bg-gray-100 text-gray-500",
            canEdit && "cursor-pointer hover:opacity-80",
            !canEdit && "cursor-default",
            isPending && "opacity-60"
          )}
          title={`${day}: ${localAvail[i] ? "Available" : "Unavailable"}`}
        >
          {day.slice(0, 3)}
        </button>
      ))}
    </div>
  )
}
