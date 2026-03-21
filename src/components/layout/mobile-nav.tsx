"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  ArrowLeftRight,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["manager", "supervisor"],
  },
  {
    label: "Schedule",
    href: "/schedule",
    icon: Calendar,
    roles: ["manager", "supervisor", "employee"],
  },
  {
    label: "Employees",
    href: "/employees",
    icon: Users,
    roles: ["manager", "supervisor"],
  },
  {
    label: "Swaps",
    href: "/swaps",
    icon: ArrowLeftRight,
    roles: ["manager", "supervisor", "employee"],
  },
  {
    label: "Compliance",
    href: "/compliance",
    icon: Shield,
    roles: ["manager"],
  },
]

interface MobileNavProps {
  userRole: string
}

export function MobileNav({ userRole }: MobileNavProps) {
  const pathname = usePathname()

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-14">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
                isActive
                  ? "text-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
