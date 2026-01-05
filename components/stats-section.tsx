const stats = [
  { value: "500+", label: "Institutions" },
  { value: "1M+", label: "Students" },
  { value: "50K+", label: "Faculty Members" },
  { value: "99.9%", label: "Uptime" },
]

export function StatsSection() {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm sm:text-base opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
