"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
    User, Mail, Phone, MapPin, CreditCard,
    Droplets, UserCircle, Upload, Loader2, Save
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import { updateMyProfile, uploadProfilePicture, type ProfileData } from "@/actions/shared/profile"

// Form schema
const formSchema = z.object({
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    bloodGroup: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    libraryBarcode: z.string().optional().nullable(),
    guardianName: z.string().optional().nullable(),
    guardianPhone: z.string().optional().nullable(),
})

interface ProfilePageProps {
    initialData: ProfileData
}

export function ProfilePage({ initialData }: ProfilePageProps) {
    const router = useRouter()
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            phone: initialData.phone || "",
            address: initialData.address || "",
            bloodGroup: initialData.bloodGroup || "",
            gender: initialData.gender || "",
            libraryBarcode: initialData.libraryBarcode || "",
            guardianName: initialData.guardianName || "",
            guardianPhone: initialData.guardianPhone || "",
        },
    })

    // Handle avatar upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Show preview immediately
        const reader = new FileReader()
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Upload
        try {
            setIsUploading(true)
            const formData = new FormData()
            formData.append("file", file)

            const result = await uploadProfilePicture(formData)

            if (result.success) {
                toast.success("Profile picture updated")
                router.refresh()
            } else {
                toast.error(result.error || "Failed to upload image")
                // Revert preview on failure
                setAvatarPreview(initialData.avatar)
            }
        } catch {
            toast.error("Something went wrong")
            setAvatarPreview(initialData.avatar)
        } finally {
            setIsUploading(false)
        }
    }

    // Handle form submit
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsSaving(true)
            const result = await updateMyProfile(values)

            if (result.success) {
                toast.success("Profile updated successfully")
                router.refresh()
            } else {
                toast.error(result.error || "Failed to update profile")
            }
        } catch {
            toast.error("Something went wrong")
        } finally {
            setIsSaving(false)
        }
    }

    const roleColor =
        initialData.role === "ADMIN" ? "bg-red-500/10 text-red-500 border-red-500/20" :
            initialData.role === "FACULTY" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"

    const roleLabel = initialData.role.charAt(0) + initialData.role.slice(1).toLowerCase()

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-6">

                {/* Left Column - Avatar & Core Info */}
                <Card className="w-full md:w-80 h-fit">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 relative group">
                            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                                <AvatarImage src={avatarPreview || ""} className="object-cover" />
                                <AvatarFallback className="text-4xl bg-muted">
                                    {initialData.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>

                            <div
                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                ) : (
                                    <Upload className="h-8 w-8" />
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </div>

                        <CardTitle>{initialData.name}</CardTitle>
                        <CardDescription>{initialData.email}</CardDescription>

                        <div className="mt-4 flex justify-center">
                            <Badge variant="outline" className={roleColor}>
                                {roleLabel}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Separator />
                        <div className="space-y-3 pt-2 text-sm">
                            {initialData.departmentName && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Department</span>
                                    <span className="font-medium">{initialData.departmentName}</span>
                                </div>
                            )}

                            {initialData.semester && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Semester</span>
                                    <span className="font-medium">Sem {initialData.semester}</span>
                                </div>
                            )}

                            {initialData.designation && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Designation</span>
                                    <span className="font-medium">{initialData.designation}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">User ID</span>
                                <span className="font-mono text-xs">{initialData.id.slice(0, 8)}...</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column - Editable Details */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Personal Details</CardTitle>
                        <CardDescription>
                            Manage your personal information and contact details
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        placeholder="+1 234 567 890"
                                        {...form.register("phone")}
                                    />
                                </div>

                                {/* Blood Group */}
                                <div className="space-y-2">
                                    <Label htmlFor="bloodGroup" className="flex items-center gap-2">
                                        <Droplets className="h-4 w-4 text-muted-foreground" />
                                        Blood Group
                                    </Label>
                                    <Select
                                        onValueChange={(val) => form.setValue("bloodGroup", val)}
                                        defaultValue={initialData.bloodGroup || undefined}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Blood Group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                                                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <Label htmlFor="gender" className="flex items-center gap-2">
                                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                                        Gender
                                    </Label>
                                    <Select
                                        onValueChange={(val) => form.setValue("gender", val)}
                                        defaultValue={initialData.gender || undefined}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Library Barcode */}
                                <div className="space-y-2">
                                    <Label htmlFor="libraryBarcode" className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        Library Barcode
                                    </Label>
                                    <Input
                                        id="libraryBarcode"
                                        placeholder="LIB-123456"
                                        {...form.register("libraryBarcode")}
                                    />
                                </div>

                                {/* Guardian Fields (Student Only) */}
                                {initialData.role === "STUDENT" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="guardianName">Guardian Name</Label>
                                            <Input
                                                id="guardianName"
                                                {...form.register("guardianName")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="guardianPhone">Guardian Phone</Label>
                                            <Input
                                                id="guardianPhone"
                                                {...form.register("guardianPhone")}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Address - Full Width */}
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <Label htmlFor="address" className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        Address
                                    </Label>
                                    <Textarea
                                        id="address"
                                        placeholder="Your full address"
                                        className="min-h-[100px]"
                                        {...form.register("address")}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 border-t bg-muted/20 p-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
