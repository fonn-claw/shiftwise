import { startOfWeek, parseISO } from "date-fns"
import { getEmployees } from "@/lib/dal/employees"
import { getShiftsForWeek } from "@/lib/dal/shifts"
import { getStore } from "@/lib/dal/stores"
import { ScheduleBuilder } from "@/components/schedule/schedule-builder"

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const params = await searchParams

  const weekStart = params.week
    ? startOfWeek(parseISO(params.week), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 })

  const [employees, shifts, store] = await Promise.all([
    getEmployees(),
    getShiftsForWeek(weekStart),
    getStore(),
  ])

  return (
    <ScheduleBuilder
      employees={employees}
      initialShifts={shifts}
      store={store}
      weekStart={weekStart.toISOString()}
    />
  )
}
