import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Providers } from "@/components/providers"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { name, email, role } = session.user

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar userRole={role} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            userName={name ?? "User"}
            userEmail={email ?? ""}
            userRole={role}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>

        <MobileNav userRole={role} />
      </div>
    </Providers>
  )
}
