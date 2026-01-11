"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, GraduationCap, UserCog, Users, Mail, Check } from "lucide-react"
import { getPublicDepartments } from "@/actions/auth/register"
import { getPublicSemesters } from "@/actions/shared/public"
import { registerStudent, registerFaculty, registerAdmin } from "@/actions/auth/register"
import { sendOTP, verifyOTP, resendOTP } from "@/actions/auth/otp"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import type { ActionResult } from "@/types/api"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [activeRole, setActiveRole] = useState("student")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [semesters, setSemesters] = useState<Array<{ id: string; name: string; number: number }>>([])
  const [loadingData, setLoadingData] = useState(true)

  // OTP verification states
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    semester: "",
    studentId: "",
    employeeId: "",
    designation: "",
  })

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setFormData({ ...formData, email: newEmail })

    // Reset OTP state if email changes after OTP was sent
    if (otpSent || otpVerified) {
      setOtpSent(false)
      setOtpVerified(false)
      setOtpValue("")
      setOtpError("")
    }

    // Validate email format in real-time
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError("Please enter a valid email address (e.g., name@example.com)")
    } else {
      setEmailError("")
    }
  }

  // Send OTP to email
  const handleSendOTP = async () => {
    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address first")
      return
    }

    setSendingOtp(true)
    setOtpError("")

    try {
      const result = await sendOTP(formData.email)

      if (result.success) {
        setOtpSent(true)
        setError("") // Clear any existing errors
      } else {
        setOtpError(result.error || "Failed to send verification code")
      }
    } catch (err) {
      setOtpError("Failed to send verification code. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      setOtpError("Please enter the complete 6-digit code")
      return
    }

    setVerifyingOtp(true)
    setOtpError("")

    try {
      const result = await verifyOTP(formData.email, otpValue)

      if (result.success) {
        setOtpVerified(true)
        setOtpError("")
      } else {
        setOtpError(result.error || "Invalid verification code")
      }
    } catch (err) {
      setOtpError("Failed to verify code. Please try again.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    setSendingOtp(true)
    setOtpError("")
    setOtpValue("")

    try {
      const result = await resendOTP(formData.email)

      if (result.success) {
        setOtpError("") // Clear any previous errors
      } else {
        setOtpError(result.error || "Failed to resend verification code")
      }
    } catch (err) {
      setOtpError("Failed to resend verification code. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  // Fetch departments and semesters on mount
  useEffect(() => {
    async function fetchData() {
      setLoadingData(true)
      try {
        const [deptResult, semResult] = await Promise.all([
          getPublicDepartments(),
          getPublicSemesters(),
        ])

        if (deptResult.success && deptResult.data) {
          setDepartments(deptResult.data)
        }

        if (semResult.success && semResult.data) {
          setSemesters(semResult.data)
        }
      } catch (err) {
        console.error("Failed to load registration data:", err)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  // Check if form is valid (used to disable submit button)
  const isFormValid = () => {
    // Common fields
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      return false
    }

    // Email format must be valid
    if (!validateEmail(formData.email)) {
      return false
    }

    // OTP must be verified
    if (!otpVerified) {
      return false
    }

    // Password match
    if (formData.password !== formData.confirmPassword) {
      return false
    }

    // Role-specific required fields
    if (activeRole === "student") {
      if (!formData.studentId || !formData.department || !formData.semester) {
        return false
      }
    } else if (activeRole === "faculty") {
      if (!formData.employeeId || !formData.department || !formData.designation) {
        return false
      }
    }

    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Client-side validation
    if (!isFormValid()) {
      setError("All fields are required")
      setLoading(false)
      return
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address")
      setEmailError("Please enter a valid email address (e.g., name@example.com)")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      let result: ActionResult<{ userId: string }> | undefined

      if (activeRole === "student") {
        if (!formData.studentId || !formData.department || !formData.semester) {
          setError("All fields are required")
          setLoading(false)
          return
        }

        result = await registerStudent({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          studentId: formData.studentId,
          departmentId: formData.department,
          semesterId: formData.semester,
        })
      } else if (activeRole === "faculty") {
        if (!formData.employeeId || !formData.department || !formData.designation) {
          setError("All fields are required")
          setLoading(false)
          return
        }

        result = await registerFaculty({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          employeeId: formData.employeeId,
          departmentId: formData.department,
          designation: formData.designation,
        })
      }

      if (!result) {
        setError("Registration failed. Please try again.")
        setLoading(false)
        return
      }

      if (result.success) {
        // Registration successful - redirect to login
        router.push("/login?registered=true")
      } else {
        setError(result.error || "Registration failed. Please try again.")
        setLoading(false)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const roles = [
    { id: "student", label: "Student", icon: GraduationCap },
    { id: "faculty", label: "Faculty", icon: Users },
  ]

  return (
    <AuthLayout title="Create an account" description="Register to get started with R.A.S.H College App">
      <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          {roles.map((role) => (
            <TabsTrigger key={role.id} value={role.id} className="flex items-center gap-2">
              <role.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{role.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((role) => (
          <TabsContent key={role.id} value={role.id}>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@university.edu"
                  value={formData.email}
                  onChange={handleEmailChange}
                  required
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="text-sm text-destructive">
                    {emailError}
                  </p>
                )}
              </div>

              {/* OTP Verification Section */}
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                {!otpSent && !otpVerified && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Verification Required
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOTP}
                      disabled={!validateEmail(formData.email) || sendingOtp}
                      className="w-full"
                    >
                      {sendingOtp ? "Sending code..." : "Send Verification Code"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      We'll send a 6-digit code to verify your email address
                    </p>
                  </div>
                )}

                {otpSent && !otpVerified && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Enter Verification Code
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      We've sent a 6-digit code to <strong>{formData.email}</strong>
                    </p>

                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otpValue}
                        onChange={(value) => setOtpValue(value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {otpError && (
                      <p className="text-sm text-destructive text-center">
                        {otpError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={otpValue.length !== 6 || verifyingOtp}
                        className="flex-1"
                      >
                        {verifyingOtp ? "Verifying..." : "Verify Code"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResendOTP}
                        disabled={sendingOtp}
                      >
                        Resend
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Code expires in 10 minutes
                    </p>
                  </div>
                )}

                {otpVerified && (
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Email verified successfully!</span>
                  </div>
                )}
              </div>

              {role.id === "student" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      placeholder="STU12345"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(value) => setFormData({ ...formData, semester: value })}
                      disabled={loadingData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading..." : "Select semester"} />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.length === 0 && !loadingData ? (
                          <SelectItem value="_none" disabled>No semesters available</SelectItem>
                        ) : (
                          semesters.map((sem) => (
                            <SelectItem key={sem.id} value={sem.id}>
                              {sem.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {role.id === "faculty" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      placeholder="FAC12345"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      placeholder="e.g., Assistant Professor"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {(role.id === "student" || role.id === "faculty") && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    disabled={loadingData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Loading..." : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length === 0 && !loadingData ? (
                        <SelectItem value="_none" disabled>No departments available</SelectItem>
                      ) : (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || loadingData || !isFormValid()}>
                {loading ? "Creating account..." : `Register as ${role.label}`}
              </Button>
            </form>
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
