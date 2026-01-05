"use client"

// ============================================================================
// CAMPUSTRACK - MDC DEPARTMENT SELECTOR COMPONENT
// ============================================================================
// Displays all departments so Admin can select which department's MDC courses to configure

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, ArrowRight } from "lucide-react"

interface MDCDepartmentSelectorProps {
    homeDepartment: {
        id: string
        name: string
        code: string
    }
    departments: Array<{
        id: string
        name: string
        code: string
        description: string | null
    }>
}

export function MDCDepartmentSelector({ homeDepartment, departments }: MDCDepartmentSelectorProps) {
    const router = useRouter()

    return (
        <main className="p-6 space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.push(`/dashboard/admin/departments/${homeDepartment.id}`)}
                className="mb-2"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {homeDepartment.name}
            </Button>

            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Configure Multi-Disciplinary Courses</CardTitle>
                    <CardDescription className="text-base">
                        Select which department's MDC courses you want to configure for <strong>{homeDepartment.name}</strong> students.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Info Card */}
            <Card className="border-indigo-500/20 bg-indigo-500/5">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-1">About MDC Configuration</h3>
                            <p className="text-sm text-muted-foreground">
                                Multi-Disciplinary Courses (MDC) allow students from <strong>{homeDepartment.name}</strong> to
                                enroll in courses offered by other departments. Select a department below to configure which
                                {homeDepartment.name} students take their MDC courses.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Department Selection Grid */}
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Select Department Offering MDC</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                        <Card
                            key={dept.id}
                            className="cursor-pointer hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200"
                            onClick={() => {
                                router.push(`/dashboard/admin/departments/${homeDepartment.id}/mdc/${dept.id}`)
                            }}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                                        <Badge variant="outline" className="mt-2">{dept.code}</Badge>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                </div>
                            </CardHeader>
                            {dept.description && (
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {dept.description}
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    )
}
