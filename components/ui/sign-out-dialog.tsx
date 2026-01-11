"use client"

// ============================================================================
// SIGN-OUT CONFIRMATION DIALOG
// ============================================================================
// Reusable confirmation modal for sign-out action

import { useState } from "react"
import { signOut } from "next-auth/react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LogOut, Loader2 } from "lucide-react"

interface SignOutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleSignOut = async () => {
        setIsLoading(true)
        try {
            await signOut({ callbackUrl: '/login' })
        } catch (error) {
            console.error("Sign out error:", error)
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        if (!isLoading) {
            onOpenChange(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                            <LogOut className="h-5 w-5 text-destructive" />
                        </div>
                        <AlertDialogTitle>Sign Out</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-2">
                        Are you sure you want to sign out? You will need to sign in again to access your dashboard.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSignOut}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing out...
                            </>
                        ) : (
                            <>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
