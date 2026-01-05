import { SettingsPage } from "@/components/settings/settings-page"
import { getMyPreferences } from "@/actions/shared/preferences"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminSettingsPage() {
    const user = await getCurrentUser()
    const prefsResult = await getMyPreferences()

    if (!prefsResult.success) {
        redirect("/login")
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>
            <SettingsPage
                initialPreferences={prefsResult.data}
                userRole={user.role}
                userEmail={user.email}
                userId={user.id}
            />
        </div>
    )
}
