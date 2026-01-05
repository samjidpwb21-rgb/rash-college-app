import { BarChart3, Calendar, ClipboardCheck, FileSpreadsheet, Shield, Users, Smartphone, Bell } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    description: "Mark and manage attendance in real-time with an intuitive interface for faculty members.",
  },
  {
    icon: Users,
    title: "Student Records",
    description: "Comprehensive student database with detailed profiles, enrollment history, and academic records.",
  },
  {
    icon: Calendar,
    title: "Course Management",
    description: "Organize courses, schedules, and faculty assignments with automated conflict detection.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visual insights with charts and reports on attendance trends, patterns, and statistics.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export Reports",
    description: "Generate and download detailed reports in PDF and Excel formats for documentation.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure portals for students, faculty, and administrators with customized permissions.",
  },
  {
    icon: Smartphone,
    title: "Mobile Responsive",
    description: "Access the system from any device with a fully responsive design optimized for mobile.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Automated alerts for low attendance, upcoming classes, and important announcements.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete solution for managing attendance across your entire institution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
