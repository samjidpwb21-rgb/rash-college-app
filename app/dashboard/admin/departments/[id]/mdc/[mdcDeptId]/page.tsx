// ============================================================================
// CAMPUSTRACK - MDC CONFIGURATION PAGE (SERVER COMPONENT)
// ============================================================================
// Configure MDC courses for a specific department pair (home + MDC provider)

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { MDCConfiguration } from "@/components/admin/mdc-configuration"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function MDCConfigurationPage({
    params
}: {
    params: Promise<{ id: string; mdcDeptId: string }>
}) {
    const { id: homeDeptId, mdcDeptId } = await params

    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect(`/dashboard/${session.user.role.toLowerCase()}`)
    }

    // Fetch both departments
    const [homeDepartment, mdcDepartment] = await Promise.all([
        prisma.department.findUnique({
            where: { id: homeDeptId },
            select: { id: true, name: true, code: true },
        }),
        prisma.department.findUnique({
            where: { id: mdcDeptId },
            select: { id: true, name: true, code: true },
        }),
    ])

    if (!homeDepartment || !mdcDepartment) {
        redirect("/dashboard/admin/departments")
    }

    // Fetch available MDC subjects from the selected department
    // RULE: isMDC = true AND departmentId = mdcDeptId (excludes home department)
    const availableMDCSubjects = await prisma.subject.findMany({
        where: {
            isMDC: true,
            departmentId: mdcDeptId,  // Only from the MDC department
        },
        select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            type: true,
            description: true,
            semester: {
                select: {
                    id: true,
                    number: true,
                    academicYear: {
                        select: {
                            year: true,
                        },
                    },
                },
            },
        },
        orderBy: [
            { semester: { academicYear: { year: "asc" } } },
            { semester: { number: "asc" } },
            { name: "asc" },
        ],
    })

    // Fetch students from home department
    const students = await prisma.studentProfile.findMany({
        where: {
            departmentId: homeDeptId,
            user: { isActive: true, deletedAt: null },
        },
        select: {
            id: true,
            enrollmentNo: true,
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
            semester: {
                select: {
                    number: true,
                    academicYear: {
                        select: {
                            year: true,
                        },
                    },
                },
            },
        },
        orderBy: [
            { semester: { academicYear: { year: "asc" } } },
            { semester: { number: "asc" } },
            { user: { name: "asc" } },
        ],
    })

    // Fetch existing MDC courses for this department pair
    const existingCourses = await prisma.mDCCourse.findMany({
        where: {
            homeDepartmentId: homeDeptId,
            mdcDepartmentId: mdcDeptId,
        },
        select: {
            id: true,
            courseName: true,
            year: true,
            semester: true,
            studentIds: true,
            facultyId: true,
        },
    })

    // Fetch ALL MDC assignments for home department (to check for existing enrollments)
    const allMDCAssignments = await prisma.mDCCourse.findMany({
        where: {
            homeDepartmentId: homeDeptId,
        },
        select: {
            studentIds: true,
            semester: true,
            courseName: true,
            id: true,
        },
    })

    // Fetch faculty for assignment dropdown - from MDC department only
    const faculty = await prisma.facultyProfile.findMany({
        where: {
            departmentId: mdcDeptId,  // Faculty must be from MDC course-offering department
            user: { isActive: true, deletedAt: null },
        },
        select: {
            id: true,
            employeeId: true,
            designation: true,
            user: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            user: { name: "asc" },
        },
    })

    const user = {
        name: session.user.name || "Admin User",
        email: session.user.email || "admin@university.edu",
        role: "System Administrator",
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="admin" />
            <div className="lg:ml-64">
                <DashboardHeader title="MDC Configuration" user={user} />
                <MDCConfiguration
                    homeDepartment={homeDepartment}
                    mdcDepartment={mdcDepartment}
                    students={students}
                    existingCourses={existingCourses}
                    allMDCAssignments={allMDCAssignments}
                    availableMDCSubjects={availableMDCSubjects}
                    faculty={faculty}
                />
            </div>
        </div>
    )
}
