import { describe, it, expect } from "vitest"
import {
  getWeekRange,
  getWeekDays,
  formatWeekLabel,
  getTimeOptions,
  isEmployeeAvailable,
  formatTime,
  getNextWeek,
  getPrevWeek,
} from "./schedule-helpers"

describe("getWeekRange", () => {
  it("returns Monday-Sunday for a Wednesday input", () => {
    const wed = new Date("2026-03-18T12:00:00") // Wednesday
    const { start, end } = getWeekRange(wed)
    expect(start.getDay()).toBe(1) // Monday
    expect(end.getDay()).toBe(0) // Sunday
    expect(start.getDate()).toBe(16) // March 16
    expect(end.getDate()).toBe(22) // March 22
  })

  it("returns same week when given Monday", () => {
    const mon = new Date("2026-03-16T12:00:00") // Monday
    const { start } = getWeekRange(mon)
    expect(start.getDate()).toBe(16)
  })

  it("returns same week when given Sunday", () => {
    const sun = new Date("2026-03-22T12:00:00") // Sunday
    const { start, end } = getWeekRange(sun)
    expect(start.getDate()).toBe(16) // Monday Mar 16
    expect(end.getDate()).toBe(22) // Sunday Mar 22
  })
})

describe("getWeekDays", () => {
  it("returns array of 7 Date objects starting from Monday", () => {
    const wed = new Date("2026-03-18T12:00:00")
    const days = getWeekDays(wed)
    expect(days).toHaveLength(7)
    expect(days[0].getDay()).toBe(1) // Monday
    expect(days[6].getDay()).toBe(0) // Sunday
  })
})

describe("formatWeekLabel", () => {
  it('returns "Mar 16 - Mar 22, 2026" format', () => {
    const date = new Date("2026-03-18T12:00:00")
    const label = formatWeekLabel(date)
    expect(label).toBe("Mar 16 - Mar 22, 2026")
  })
})

describe("getNextWeek / getPrevWeek", () => {
  it("getNextWeek returns next Monday", () => {
    const date = new Date("2026-03-18T12:00:00")
    const next = getNextWeek(date)
    expect(next.getDate()).toBe(23) // March 23
    expect(next.getDay()).toBe(1) // Monday
  })

  it("getPrevWeek returns previous Monday", () => {
    const date = new Date("2026-03-18T12:00:00")
    const prev = getPrevWeek(date)
    expect(prev.getDate()).toBe(9) // March 9
    expect(prev.getDay()).toBe(1) // Monday
  })
})

describe("getTimeOptions", () => {
  it('returns 25 entries from "09:00" to "21:00" in 30-min steps', () => {
    const options = getTimeOptions("09:00", "21:00")
    expect(options).toHaveLength(25)
    expect(options[0]).toBe("09:00")
    expect(options[1]).toBe("09:30")
    expect(options[options.length - 1]).toBe("21:00")
  })

  it("uses default store hours when no args", () => {
    const options = getTimeOptions()
    expect(options[0]).toBe("09:00")
    expect(options[options.length - 1]).toBe("21:00")
  })

  it("handles custom time range", () => {
    const options = getTimeOptions("10:00", "12:00")
    expect(options).toHaveLength(5)
    expect(options[0]).toBe("10:00")
    expect(options[4]).toBe("12:00")
  })
})

describe("isEmployeeAvailable", () => {
  // Schema convention: 0=Monday, 6=Sunday
  const availability = [
    { dayOfWeek: 0, isAvailable: true },  // Monday
    { dayOfWeek: 1, isAvailable: true },  // Tuesday
    { dayOfWeek: 2, isAvailable: true },  // Wednesday
    { dayOfWeek: 3, isAvailable: true },  // Thursday
    { dayOfWeek: 4, isAvailable: true },  // Friday
    { dayOfWeek: 5, isAvailable: false }, // Saturday
    { dayOfWeek: 6, isAvailable: false }, // Sunday
  ]

  it("returns true when dayOfWeek has isAvailable=true", () => {
    // Monday March 16, 2026
    const monday = new Date("2026-03-16T12:00:00")
    expect(isEmployeeAvailable(availability, monday)).toBe(true)
  })

  it("returns false when dayOfWeek has isAvailable=false", () => {
    // Saturday March 21, 2026
    const saturday = new Date("2026-03-21T12:00:00")
    expect(isEmployeeAvailable(availability, saturday)).toBe(false)
  })

  it("returns false for Sunday when isAvailable=false", () => {
    // Sunday March 22, 2026
    const sunday = new Date("2026-03-22T12:00:00")
    expect(isEmployeeAvailable(availability, sunday)).toBe(false)
  })

  it("returns true when no availability record exists for that day", () => {
    const partialAvail = [
      { dayOfWeek: 0, isAvailable: true }, // Only Monday
    ]
    // Tuesday - no record exists, should default to true
    const tuesday = new Date("2026-03-17T12:00:00")
    expect(isEmployeeAvailable(partialAvail, tuesday)).toBe(true)
  })

  it("returns true for empty availability array", () => {
    const wednesday = new Date("2026-03-18T12:00:00")
    expect(isEmployeeAvailable([], wednesday)).toBe(true)
  })
})

describe("formatTime", () => {
  it('converts "09:00" to "9:00 AM"', () => {
    expect(formatTime("09:00")).toBe("9:00 AM")
  })

  it('converts "15:00" to "3:00 PM"', () => {
    expect(formatTime("15:00")).toBe("3:00 PM")
  })

  it('converts "12:00" to "12:00 PM"', () => {
    expect(formatTime("12:00")).toBe("12:00 PM")
  })

  it('converts "00:00" to "12:00 AM"', () => {
    expect(formatTime("00:00")).toBe("12:00 AM")
  })

  it('converts "21:00" to "9:00 PM"', () => {
    expect(formatTime("21:00")).toBe("9:00 PM")
  })

  it('converts "09:30" to "9:30 AM"', () => {
    expect(formatTime("09:30")).toBe("9:30 AM")
  })
})
