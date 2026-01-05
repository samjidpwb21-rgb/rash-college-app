import { ProfilePage } from "@/components/profile/profile-page"
import { getMyProfile } from "@/actions/shared/profile"
import { redirect } from "next/navigation"

export default async function StudentProfilePage() {
    const result = await getMyProfile()

    if (!result.success) {
        redirect("/login")
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Student Profile</h2>
            </div>
            <ProfilePage initialData={result.data} />
        </div>
    )
}
