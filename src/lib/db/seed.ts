import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import {
  stores,
  users,
  employeeRoles,
  availability,
  shifts,
  swapRequests,
  shiftPickups,
  auditLog,
} from "./schema"
import { addDays, startOfWeek, format } from "date-fns"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

type JobRole = "cashier" | "stock" | "manager" | "visual_merch"
type UserRole = "manager" | "supervisor" | "employee"

interface EmployeeData {
  name: string
  email: string
  role: UserRole
  hourlyRate: string
  maxHoursPerWeek: number
  phone: string
  jobRoles: JobRole[]
  availableDays: number[] // 0=Mon, 6=Sun
}

const employees: EmployeeData[] = [
  {
    name: "Sarah Chen",
    email: "manager@shiftwise.app",
    role: "manager",
    hourlyRate: "28.00",
    maxHoursPerWeek: 40,
    phone: "555-0101",
    jobRoles: ["manager"],
    availableDays: [0, 1, 2, 3, 4], // Mon-Fri
  },
  {
    name: "Mike Torres",
    email: "supervisor@shiftwise.app",
    role: "supervisor",
    hourlyRate: "26.00",
    maxHoursPerWeek: 40,
    phone: "555-0102",
    jobRoles: ["manager", "cashier"],
    availableDays: [0, 1, 2, 3, 4, 5, 6], // Any day
  },
  {
    name: "Emma Wilson",
    email: "employee@shiftwise.app",
    role: "employee",
    hourlyRate: "17.00",
    maxHoursPerWeek: 32,
    phone: "555-0103",
    jobRoles: ["cashier"],
    availableDays: [0, 1, 2, 3, 4, 5], // Mon-Sat
  },
  {
    name: "Jake Kim",
    email: "jake.kim@shiftwise.app",
    role: "employee",
    hourlyRate: "16.00",
    maxHoursPerWeek: 25,
    phone: "555-0104",
    jobRoles: ["cashier", "stock"],
    availableDays: [1, 2, 3, 4, 5, 6], // Tue-Sun
  },
  {
    name: "Ana Morales",
    email: "ana.morales@shiftwise.app",
    role: "employee",
    hourlyRate: "16.00",
    maxHoursPerWeek: 30,
    phone: "555-0105",
    jobRoles: ["cashier"],
    availableDays: [0, 1, 2, 3, 4], // Mon-Fri
  },
  {
    name: "Carlos Ruiz",
    email: "carlos.ruiz@shiftwise.app",
    role: "employee",
    hourlyRate: "15.00",
    maxHoursPerWeek: 40,
    phone: "555-0106",
    jobRoles: ["stock"],
    availableDays: [0, 1, 2, 3, 4, 5, 6], // Any day
  },
  {
    name: "Priya Patel",
    email: "priya.patel@shiftwise.app",
    role: "employee",
    hourlyRate: "16.00",
    maxHoursPerWeek: 35,
    phone: "555-0107",
    jobRoles: ["stock", "cashier"],
    availableDays: [2, 3, 4, 5, 6], // Wed-Sun
  },
  {
    name: "Tom Liu",
    email: "tom.liu@shiftwise.app",
    role: "employee",
    hourlyRate: "15.00",
    maxHoursPerWeek: 20,
    phone: "555-0108",
    jobRoles: ["cashier"],
    availableDays: [2, 5, 6], // Wed, Sat, Sun
  },
  {
    name: "Maya Johnson",
    email: "maya.johnson@shiftwise.app",
    role: "employee",
    hourlyRate: "18.00",
    maxHoursPerWeek: 30,
    phone: "555-0109",
    jobRoles: ["visual_merch"],
    availableDays: [0, 1, 2, 3, 4], // Mon-Fri
  },
  {
    name: "David Park",
    email: "david.park@shiftwise.app",
    role: "employee",
    hourlyRate: "15.00",
    maxHoursPerWeek: 40,
    phone: "555-0110",
    jobRoles: ["stock"],
    availableDays: [0, 1, 2, 3, 4, 5, 6], // Any day
  },
  {
    name: "Lisa Chen",
    email: "lisa.chen@shiftwise.app",
    role: "employee",
    hourlyRate: "16.00",
    maxHoursPerWeek: 25,
    phone: "555-0111",
    jobRoles: ["cashier"],
    availableDays: [3, 4, 5, 6], // Thu-Sun
  },
  {
    name: "Ryan O'Brien",
    email: "ryan.obrien@shiftwise.app",
    role: "employee",
    hourlyRate: "17.00",
    maxHoursPerWeek: 35,
    phone: "555-0112",
    jobRoles: ["stock", "visual_merch"],
    availableDays: [0, 1, 2, 3, 4, 5], // Mon-Sat
  },
]

async function seed() {
  console.log("Seeding database...")

  // Clear existing data in reverse FK order
  console.log("Clearing existing data...")
  await db.delete(auditLog)
  await db.delete(swapRequests)
  await db.delete(shiftPickups)
  await db.delete(shifts)
  await db.delete(availability)
  await db.delete(employeeRoles)
  await db.delete(users)
  await db.delete(stores)

  // 1. Create store
  console.log("Creating store...")
  const [store] = await db
    .insert(stores)
    .values({
      name: "Urban Threads",
      openTime: "09:00",
      closeTime: "21:00",
      weeklyBudget: "12000.00",
      timezone: "America/New_York",
    })
    .returning()

  // 2. Hash password for all demo accounts
  const passwordHash = await bcrypt.hash("demo1234", 10)

  // 3. Insert all 12 employees
  console.log("Creating employees...")
  for (const emp of employees) {
    const [user] = await db
      .insert(users)
      .values({
        email: emp.email,
        passwordHash,
        name: emp.name,
        role: emp.role,
        hourlyRate: emp.hourlyRate,
        maxHoursPerWeek: emp.maxHoursPerWeek,
        phone: emp.phone,
        storeId: store.id,
      })
      .returning()

    // Insert job roles
    for (const roleName of emp.jobRoles) {
      await db.insert(employeeRoles).values({
        userId: user.id,
        roleName,
      })
    }

    // Insert availability for all 7 days
    for (let day = 0; day <= 6; day++) {
      await db.insert(availability).values({
        userId: user.id,
        dayOfWeek: day,
        isAvailable: emp.availableDays.includes(day),
      })
    }
  }

  // 4. Seed shifts for current week
  console.log("Creating shifts...")
  const currentMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const dateStr = (dayOffset: number) =>
    format(addDays(currentMonday, dayOffset), "yyyy-MM-dd")

  // Look up user IDs by email
  const allUsers = await db.select().from(users)
  const userByEmail = (email: string) => {
    const u = allUsers.find((u) => u.email === email)
    if (!u) throw new Error(`User not found: ${email}`)
    return u.id
  }

  const sarahId = userByEmail("manager@shiftwise.app")
  const mikeId = userByEmail("supervisor@shiftwise.app")
  const emmaId = userByEmail("employee@shiftwise.app")
  const jakeId = userByEmail("jake.kim@shiftwise.app")
  const anaId = userByEmail("ana.morales@shiftwise.app")
  const carlosId = userByEmail("carlos.ruiz@shiftwise.app")
  const priyaId = userByEmail("priya.patel@shiftwise.app")
  const tomId = userByEmail("tom.liu@shiftwise.app")
  const mayaId = userByEmail("maya.johnson@shiftwise.app")
  const davidId = userByEmail("david.park@shiftwise.app")
  const lisaId = userByEmail("lisa.chen@shiftwise.app")
  const ryanId = userByEmail("ryan.obrien@shiftwise.app")

  type ShiftSeed = {
    employeeId: number | null
    date: string
    startTime: string
    endTime: string
    roleName: "cashier" | "stock" | "manager" | "visual_merch"
    breakMinutes: number
    status: "assigned" | "open"
    storeId: number
  }

  const shiftData: ShiftSeed[] = [
    // Sarah Chen (manager): Mon-Fri 9:00-17:00, manager, 30-min break = 7.5h x 5 = 37.5h
    ...[0, 1, 2, 3, 4].map((d) => ({
      employeeId: sarahId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "17:00",
      roleName: "manager" as const,
      breakMinutes: 30,
      status: "assigned" as const,
      storeId: store.id,
    })),

    // Mike Torres (supervisor): Mon-Fri 9:00-17:00, manager, 30-min break = 7.5h x 5 = 37.5h
    ...[0, 1, 2, 3, 4].map((d) => ({
      employeeId: mikeId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "17:00",
      roleName: "manager" as const,
      breakMinutes: 30,
      status: "assigned" as const,
      storeId: store.id,
    })),

    // Emma Wilson: Mon, Wed, Fri 9:00-15:00 cashier = 18h; Tue, Thu 15:00-21:00 cashier = 12h. Total 30h
    ...[0, 2, 4].map((d) => ({
      employeeId: emmaId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),
    ...[1, 3].map((d) => ({
      employeeId: emmaId,
      date: dateStr(d),
      startTime: "15:00",
      endTime: "21:00",
      roleName: "cashier" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),

    // Jake Kim: 38 hours total (near overtime)
    // Tue 9:00-17:00 stock 30min = 7.5h
    // Wed 9:00-17:00 stock 30min = 7.5h
    // Thu 9:00-17:00 cashier 30min = 7.5h
    // Fri 15:00-21:00 stock = 6h
    // Sat 9:00-15:00 cashier = 6h
    // Sun 15:00-18:30 stock = 3.5h
    // Total = 7.5 + 7.5 + 7.5 + 6 + 6 + 3.5 = 38h
    {
      employeeId: jakeId,
      date: dateStr(1),
      startTime: "09:00",
      endTime: "17:00",
      roleName: "stock",
      breakMinutes: 30,
      status: "assigned",
      storeId: store.id,
    },
    {
      employeeId: jakeId,
      date: dateStr(2),
      startTime: "09:00",
      endTime: "17:00",
      roleName: "stock",
      breakMinutes: 30,
      status: "assigned",
      storeId: store.id,
    },
    {
      employeeId: jakeId,
      date: dateStr(3),
      startTime: "09:00",
      endTime: "17:00",
      roleName: "cashier",
      breakMinutes: 30,
      status: "assigned",
      storeId: store.id,
    },
    {
      employeeId: jakeId,
      date: dateStr(4),
      startTime: "15:00",
      endTime: "21:00",
      roleName: "stock",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },
    {
      employeeId: jakeId,
      date: dateStr(5),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },
    {
      employeeId: jakeId,
      date: dateStr(6),
      startTime: "15:00",
      endTime: "18:30",
      roleName: "stock",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },

    // Ana Morales: Mon-Thu 9:00-15:00 cashier = 24h + Fri 9:00-15:00 = 30h
    ...[0, 1, 2, 3].map((d) => ({
      employeeId: anaId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),
    {
      employeeId: anaId,
      date: dateStr(4),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    },

    // Carlos Ruiz: Mon-Fri 15:00-21:00 stock = 30h, Sat 9:00-15:00 stock = 6h. Total 36h
    ...[0, 1, 2, 3, 4].map((d) => ({
      employeeId: carlosId,
      date: dateStr(d),
      startTime: "15:00",
      endTime: "21:00",
      roleName: "stock" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),
    {
      employeeId: carlosId,
      date: dateStr(5),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "stock",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },

    // Priya Patel: Wed-Fri 9:00-15:00 cashier = 18h, Sat-Sun 15:00-21:00 stock = 12h. Total 30h
    ...[2, 3, 4].map((d) => ({
      employeeId: priyaId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),
    ...[5, 6].map((d) => ({
      employeeId: priyaId,
      date: dateStr(d),
      startTime: "15:00",
      endTime: "21:00",
      roleName: "stock" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),

    // Tom Liu: Wed 15:00-21:00 cashier = 6h, Sat 9:00-15:00 = 6h, Sun 9:00-15:00 = 6h. Total 18h
    {
      employeeId: tomId,
      date: dateStr(2),
      startTime: "15:00",
      endTime: "21:00",
      roleName: "cashier",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },
    {
      employeeId: tomId,
      date: dateStr(5),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },
    {
      employeeId: tomId,
      date: dateStr(6),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },

    // Maya Johnson: Mon-Fri 9:00-15:00 visual_merch = 30h
    ...[0, 1, 2, 3, 4].map((d) => ({
      employeeId: mayaId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "visual_merch" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),

    // David Park: Mon-Fri 15:00-21:00 stock = 30h, Sun 9:00-15:00 stock = 6h. Total 36h
    ...[0, 1, 2, 3, 4].map((d) => ({
      employeeId: davidId,
      date: dateStr(d),
      startTime: "15:00",
      endTime: "21:00",
      roleName: "stock" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),
    {
      employeeId: davidId,
      date: dateStr(6),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "stock",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },

    // Lisa Chen: Thu-Fri 15:00-21:00 cashier = 12h, Sat-Sun 9:00-15:00 cashier = 12h. Total 24h
    ...[3, 4].map((d) => ({
      employeeId: lisaId,
      date: dateStr(d),
      startTime: "15:00",
      endTime: "21:00",
      roleName: "cashier" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),
    ...[5, 6].map((d) => ({
      employeeId: lisaId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "cashier" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),

    // Ryan O'Brien: Mon-Wed 9:00-15:00 stock = 18h, Thu-Fri 9:00-15:00 visual_merch = 12h, Sat 9:00-15:00 stock = 6h. Total 36h
    ...[0, 1, 2].map((d) => ({
      employeeId: ryanId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "stock" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),
    ...[3, 4].map((d) => ({
      employeeId: ryanId,
      date: dateStr(d),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "visual_merch" as const,
      breakMinutes: 0,
      status: "assigned" as const,
      storeId: store.id,
    })),
    {
      employeeId: ryanId,
      date: dateStr(5),
      startTime: "09:00",
      endTime: "15:00",
      roleName: "stock",
      breakMinutes: 0,
      status: "assigned",
      storeId: store.id,
    },

    // Open shift: Thursday 15:00-21:00 cashier, status "open"
    {
      employeeId: null,
      date: dateStr(3),
      startTime: "15:00",
      endTime: "21:00",
      roleName: "cashier",
      breakMinutes: 0,
      status: "open",
      storeId: store.id,
    },
  ]

  // Insert all shifts
  for (const shift of shiftData) {
    await db.insert(shifts).values(shift)
  }

  // 5. Create pending swap request: Ana's Friday AM <-> Carlos's Friday PM
  console.log("Creating swap request...")
  const { eq, and } = await import("drizzle-orm")

  const [anaFridayShift] = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.employeeId, anaId),
        eq(shifts.date, dateStr(4)),
        eq(shifts.startTime, "09:00")
      )
    )

  const [carlosFridayShift] = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.employeeId, carlosId),
        eq(shifts.date, dateStr(4)),
        eq(shifts.startTime, "15:00")
      )
    )

  if (anaFridayShift && carlosFridayShift) {
    await db.insert(swapRequests).values({
      requestorId: anaId,
      requestorShiftId: anaFridayShift.id,
      targetEmployeeId: carlosId,
      targetShiftId: carlosFridayShift.id,
      status: "pending",
    })
  }

  console.log("Seed complete!")
  console.log(`  - 1 store: ${store.name}`)
  console.log(`  - ${employees.length} employees`)
  console.log(`  - ${shiftData.length} shifts (${shiftData.filter((s) => s.status === "open").length} open)`)
  console.log("  - 1 pending swap request (Ana Morales <-> Carlos Ruiz, Friday)")
  console.log("  - Demo accounts:")
  console.log("    manager@shiftwise.app / demo1234 (Sarah Chen - Manager)")
  console.log(
    "    supervisor@shiftwise.app / demo1234 (Mike Torres - Supervisor)"
  )
  console.log(
    "    employee@shiftwise.app / demo1234 (Emma Wilson - Employee)"
  )
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
