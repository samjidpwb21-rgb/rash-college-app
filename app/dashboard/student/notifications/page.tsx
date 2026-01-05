import { NotificationsPage } from "@/components/notifications/notifications-page"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function StudentNotificationsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <NotificationsPage />
    </div>
  )
}
