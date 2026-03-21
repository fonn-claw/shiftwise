import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { stores, users, employeeRoles, availability } from "./schema"
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

  console.log("Seed complete!")
  console.log(`  - 1 store: ${store.name}`)
  console.log(`  - ${employees.length} employees`)
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
