import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  getDay,
} from "date-fns"

export function getWeekRange(weekStart: Date): { start: Date; end: Date } {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 })
  const end = endOfWeek(weekStart, { weekStartsOn: 1 })
  return { start, end }
}

export function getWeekDays(weekStart: Date): Date[] {
  const { start, end } = getWeekRange(weekStart)
  return eachDayOfInterval({ start, end })
}

export function formatWeekLabel(weekStart: Date): string {
  const { start, end } = getWeekRange(weekStart)
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
}

export function getNextWeek(weekStart: Date): Date {
  return addWeeks(startOfWeek(weekStart, { weekStartsOn: 1 }), 1)
}

export function getPrevWeek(weekStart: Date): Date {
  return subWeeks(startOfWeek(weekStart, { weekStartsOn: 1 }), 1)
}

export function getTimeOptions(
  storeOpen = "09:00",
  storeClose = "21:00"
): string[] {
  const options: string[] = []
  const [openH, openM] = storeOpen.split(":").map(Number)
  const [closeH, closeM] = storeClose.split(":").map(Number)
  let h = openH
  let m = openM
  while (h < closeH || (h === closeH && m <= closeM)) {
    options.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    )
    m += 30
    if (m >= 60) {
      h++
      m = 0
    }
  }
  return options
}

/**
 * Check if an employee is available on a given date.
 * Schema convention: 0=Monday, 6=Sunday
 * JS getDay: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
export function isEmployeeAvailable(
  availability: { dayOfWeek: number; isAvailable: boolean }[],
  date: Date
): boolean {
  const jsDay = getDay(date)
  const ourDay = jsDay === 0 ? 6 : jsDay - 1
  const avail = availability.find((a) => a.dayOfWeek === ourDay)
  return avail?.isAvailable ?? true
}

/**
 * Convert "HH:mm" 24h format to "h:mm AM/PM" 12h format.
 */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`
}
