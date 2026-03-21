"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/schedule": "Schedule",
  "/employees": "Employees",
  "/swaps": "Swap Requests",
  "/compliance": "Compliance",
}

const roleBadgeStyles: Record<string, string> = {
  manager: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  supervisor: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  employee: "bg-green-100 text-green-700 hover:bg-green-100",
}

interface HeaderProps {
  userName: string
  userEmail: string
  userRole: string
}

export function Header({ userName, userEmail, userRole }: HeaderProps) {
  const pathname = usePathname()

  const pageTitle =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "ShiftWise Pro"

  const roleLabel =
    userRole.charAt(0).toUpperCase() + userRole.slice(1)

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b border-gray-200 bg-white">
      <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-sm text-gray-600">
          {userName}
        </span>
        <Badge
          className={cn(
            "text-xs font-medium",
            roleBadgeStyles[userRole] ?? "bg-gray-100 text-gray-700"
          )}
        >
          {roleLabel}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
          >
            <User className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-gray-500">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
