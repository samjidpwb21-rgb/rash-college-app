"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Moon, Sun, Bell, User, Laptop, Shield, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { updatePreferences, type UserPreferencesData } from "@/actions/shared/preferences"
import { Badge } from "@/components/ui/badge"
import { SignOutDialog } from "@/components/ui/sign-out-dialog"

interface SettingsPageProps {
    initialPreferences: UserPreferencesData
    userRole: string
    userEmail: string
    userId: string
}

export function SettingsPage({
    initialPreferences,
    userRole,
    userEmail,
    userId
}: SettingsPageProps) {
    const { setTheme, theme } = useTheme()
    const router = useRouter()
    const [prefs, setPrefs] = useState(initialPreferences)
    const [isLoading, setIsLoading] = useState(false)
    const [showSignOutDialog, setShowSignOutDialog] = useState(false)

    // Sync theme with prefs on mount (optional - theme provider handles this usually)
    // But we want to ensure the DB state matches local state if needed

    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme)

        // Also save to DB if it's dark/light (system is tricky to save as bool)
        const isDark = newTheme === 'dark'
        if (isDark !== prefs.darkMode) {
            await handlePreferenceUpdate({ darkMode: isDark })
        }
    }

    const handlePreferenceUpdate = async (updates: Partial<UserPreferencesData>) => {
        try {
            setIsLoading(true)
            const newPrefs = { ...prefs, ...updates }
            setPrefs(newPrefs) // Optimistic update

            const result = await updatePreferences(updates)

            if (!result.success) {
                setPrefs(prefs) // Revert on failure
                toast.error("Failed to update settings")
            } else {
                // toast.success("Settings saved") // Optional: maybe too noisy
            }
        } catch {
            setPrefs(prefs)
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">

            {/* Account Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle>Account</CardTitle>
                    </div>
                    <CardDescription>
                        Manage your account settings and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium">{userEmail}</p>
                                <p className="text-xs text-muted-foreground font-mono">ID: {userId.slice(0, 8)}...</p>
                            </div>
                        </div>
                        <Badge variant="secondary">{userRole}</Badge>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => router.push(`/dashboard/${userRole.toLowerCase()}/profile`)}
                    >
                        <User className="mr-2 h-4 w-4" />
                        Edit Profile Details
                    </Button>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Laptop className="h-5 w-5 text-primary" />
                        <CardTitle>Appearance</CardTitle>
                    </div>
                    <CardDescription>
                        Customize how the application looks properly
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Dark Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Switch between light and dark themes
                            </p>
                        </div>
                        <div className="flex items-center bg-muted rounded-full p-1 border">
                            <Button
                                variant={theme === 'light' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 rounded-full text-xs"
                                onClick={() => handleThemeChange('light')}
                            >
                                <Sun className="h-3.5 w-3.5 mr-1" /> Light
                            </Button>
                            <Button
                                variant={theme === 'dark' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 rounded-full text-xs"
                                onClick={() => handleThemeChange('dark')}
                            >
                                <Moon className="h-3.5 w-3.5 mr-1" /> Dark
                            </Button>
                            <Button
                                variant={theme === 'system' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 rounded-full text-xs"
                                onClick={() => setTheme('system')} // System doesn't update backend bool easily
                            >
                                <Laptop className="h-3.5 w-3.5 mr-1" /> System
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        <CardTitle>Notifications</CardTitle>
                    </div>
                    <CardDescription>
                        Configure how you receive alerts and updates
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive in-app notifications for important updates
                            </p>
                        </div>
                        <Switch
                            checked={prefs.notificationsEnabled}
                            onCheckedChange={(checked) => handlePreferenceUpdate({ notificationsEnabled: checked })}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4 pt-2">
                        <h4 className="text-sm font-medium">Notification Types</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 border rounded-md">
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Attendance Alerts</p>
                                    <p className="text-xs text-muted-foreground">Daily attendance updates</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 border rounded-md">
                                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Notices & Events</p>
                                    <p className="text-xs text-muted-foreground">College announcements</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone (Sign Out) */}
            <div className="pt-4">
                <Button
                    variant="destructive"
                    className="w-full md:w-auto"
                    onClick={() => setShowSignOutDialog(true)}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>

            {/* Sign Out Confirmation Dialog */}
            <SignOutDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog} />

        </div>
    )
}
