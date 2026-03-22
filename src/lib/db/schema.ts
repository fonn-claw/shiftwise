import {
  pgTable,
  integer,
  varchar,
  boolean,
  timestamp,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", [
  "manager",
  "supervisor",
  "employee",
])

export const jobRoleEnum = pgEnum("job_role", [
  "cashier",
  "stock",
  "manager",
  "visual_merch",
])

export const stores = pgTable("stores", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  openTime: varchar("open_time", { length: 5 }).notNull(), // "09:00"
  closeTime: varchar("close_time", { length: 5 }).notNull(), // "21:00"
  weeklyBudget: decimal("weekly_budget", { precision: 10, scale: 2 }).notNull(),
  timezone: varchar({ length: 50 }).notNull().default("America/New_York"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  role: userRoleEnum().notNull().default("employee"),
  hourlyRate: decimal("hourly_rate", { precision: 6, scale: 2 }).notNull(),
  maxHoursPerWeek: integer("max_hours_per_week").notNull().default(40),
  phone: varchar({ length: 20 }),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const employeeRoles = pgTable("employee_roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleName: jobRoleEnum("role_name").notNull(),
})

export const availability = pgTable("availability", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Monday, 6 = Sunday
  isAvailable: boolean("is_available").notNull().default(true),
})

export const shiftStatusEnum = pgEnum("shift_status", ["assigned", "open"])

export const shifts = pgTable("shifts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").references(() => users.id, {
    onDelete: "cascade",
  }), // nullable for open shifts
  date: varchar({ length: 10 }).notNull(), // "2026-03-16" ISO date string
  startTime: varchar("start_time", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("end_time", { length: 5 }).notNull(), // "15:00"
  roleName: jobRoleEnum("role_name").notNull(),
  breakMinutes: integer("break_minutes").notNull().default(0),
  status: shiftStatusEnum().notNull().default("assigned"),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
