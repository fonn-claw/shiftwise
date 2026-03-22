import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stores } from "@/lib/db/schema"

export type Store = {
  id: number
  name: string
  openTime: string
  closeTime: string
  weeklyBudget: string
  timezone: string
  createdAt: Date
}

export async function getStore(): Promise<Store> {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  const allStores = await db.select().from(stores)
  if (allStores.length === 0) throw new Error("No store found")

  return allStores[0]
}
