import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function DashboardRoot() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "employee") {
    redirect("/schedule")
  }

  redirect("/dashboard")
}
