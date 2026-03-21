export const ROLE_COLORS = {
  cashier: { bg: "bg-blue-100", text: "text-blue-700", label: "Cashier" },
  stock: { bg: "bg-green-100", text: "text-green-700", label: "Stock" },
  manager: { bg: "bg-orange-100", text: "text-orange-700", label: "Manager" },
  visual_merch: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    label: "Visual Merch",
  },
} as const

export const USER_ROLE_LABELS = {
  manager: "Manager",
  supervisor: "Supervisor",
  employee: "Employee",
} as const

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const
