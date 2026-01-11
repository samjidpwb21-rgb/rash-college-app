import { Suspense } from "react"
import { VerifyOTPClient } from "@/components/auth/verify-otp-client"

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={null}>
            <VerifyOTPClient />
        </Suspense>
    )
}
