"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  formatWeekLabel,
  getNextWeek,
  getPrevWeek,
} from "@/lib/utils/schedule-helpers"

interface WeekNavigatorProps {
  weekStart: string
  onCopyWeek: (sourceWeekStart: string, targetWeekStart: string) => Promise<void>
  isManager: boolean
  isCopying: boolean
}

export function WeekNavigator({
  weekStart,
  onCopyWeek,
  isManager,
  isCopying,
}: WeekNavigatorProps) {
  const router = useRouter()
  const [showCopyDialog, setShowCopyDialog] = useState(false)

  const currentDate = parseISO(weekStart)
  const prevWeek = getPrevWeek(currentDate)
  const nextWeek = getNextWeek(currentDate)

  const currentLabel = formatWeekLabel(currentDate)
  const prevWeekLabel = formatWeekLabel(prevWeek)

  const navigateTo = (date: Date) => {
    router.push(`/schedule?week=${format(date, "yyyy-MM-dd")}`)
  }

  const handleCopy = async () => {
    await onCopyWeek(
      format(prevWeek, "yyyy-MM-dd"),
      format(currentDate, "yyyy-MM-dd")
    )
    setShowCopyDialog(false)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateTo(prevWeek)}
            data-testid="schedule-prev-week-btn"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[200px] text-center text-sm font-medium text-gray-700">
            {currentLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateTo(nextWeek)}
            data-testid="schedule-next-week-btn"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {isManager && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2 gap-1.5"
              onClick={() => setShowCopyDialog(true)}
              data-testid="copy-prev-week-btn"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy Previous Week</span>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Previous Week</DialogTitle>
            <DialogDescription>
              Copy all shifts from {prevWeekLabel} to {currentLabel}? This will
              add shifts without removing existing ones.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCopyDialog(false)}
              disabled={isCopying}
            >
              Cancel
            </Button>
            <Button onClick={handleCopy} disabled={isCopying} data-testid="copy-schedule-confirm-btn">
              {isCopying ? "Copying..." : "Copy Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
