"use client"

import { useDroppable } from "@dnd-kit/react"
import { Plus } from "lucide-react"
import { isEmployeeAvailable } from "@/lib/utils/schedule-helpers"
import { cn } from "@/lib/utils"

interface DayCellProps {
  employeeId: number
  date: string
  dateObj: Date
  employeeAvailability: { dayOfWeek: number; isAvailable: boolean }[]
  isToday: boolean
  children: React.ReactNode
  onClick: () => void
  isManager: boolean
  isEmpty: boolean
}

export function DayCell({
  employeeId,
  date,
  dateObj,
  employeeAvailability,
  isToday,
  children,
  onClick,
  isManager,
  isEmpty,
}: DayCellProps) {
  const { ref, isDropTarget } = useDroppable({
    id: `cell-${employeeId}-${date}`,
    data: { employeeId, date },
    disabled: !isManager,
  })

  const isAvailable = isEmployeeAvailable(employeeAvailability, dateObj)

  return (
    <div
      ref={ref}
      onClick={() => {
        if (isAvailable && isEmpty) {
          onClick()
        }
      }}
      className={cn(
        "group relative min-h-[72px] border-b border-r border-gray-200 p-1.5 last:border-r-0 transition-colors",
        !isAvailable && "border-2 border-red-300 bg-red-50",
        isToday && isAvailable && !isDropTarget && "bg-indigo-50/50",
        isAvailable && isEmpty && !isDropTarget && "cursor-pointer hover:bg-gray-50",
        isDropTarget && isAvailable && "ring-2 ring-green-400 bg-green-50",
        isDropTarget && !isAvailable && "ring-2 ring-red-400 bg-red-100"
      )}
    >
      {!isAvailable && isEmpty && (
        <span className="text-[10px] text-red-400">Unavailable</span>
      )}

      {children}

      {isAvailable && isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <Plus className="h-5 w-5 text-gray-300" />
        </div>
      )}
    </div>
  )
}
