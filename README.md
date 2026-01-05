
# R.A.S.H College App

A comprehensive, role-based college management system designed to streamline attendance tracking, course management, and campus communication for administrators, faculty, and students.

## 🚀 Key Features

### 🎓 Student Portal
- **Dashboard**: Real-time overview of attendance stats, today's schedule, and notices.
- **Attendance Tracking**: View detailed subject-wise and monthly attendance records.
- **Digital Timetable**: Access daily class schedules and room allocations.
- **Notice Board**: Stay updated with academic and event announcements.

### 👨‍🏫 Faculty Portal
- **Class Management**: View assigned subjects and daily teaching schedule.
- **Attendance Marking**: specialized interface for quick and accurate attendance taking.
- **Student Insights**: Access student profiles and academic history.

### 🛡️ Admin Portal
- **User Management**: Oversee student and faculty records with role-based permissions.
- **Academic Configuration**: Manage departments, courses, semesters, and timetables.
- **System Analytics**: Visual insights into college-wide attendance and user distribution.
- **MDC System**: fully integrated Multi-Disciplinary Course management.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)

## ⚙️ Local Setup

Follow these steps to get the project running on your local machine.

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/rash-college-app.git
    cd rash-college-app
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory by copying the example:
    ```bash
    cp .env.example .env
    ```
    Update the `DATABASE_URL` and `NEXTAUTH_SECRET` in `.env` with your local configuration.

4.  **Database Setup**
    Push the schema to your local database:
    ```bash
    npx prisma db push
    ```
    (Optional) Seed the database if a seed script is provided:
    ```bash
    npx prisma db seed
    ```

5.  **Run the development server**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔮 Future Scope

- **Mobile App**: React Native mobile counterpart for on-the-go access.
- **Notifications**: Email and push notifications for critical updates.
- **Assignment Module**: Digital submission and grading system.
- **Library Integration**: Book issuing and tracking.

---
Built with ❤️ by the R.A.S.H Team

# R.A.S.H – College Management Application

A unified college management application designed to digitalize and simplify core academic and administrative operations within a college campus.

## 🚀 Features
- Digital attendance management system
- Multi-Disciplinary Course (MDC) attendance support
- Centralized digital notice board
- Event and academic calendar management
- Role-based access for students, faculty, and administrators
- Responsive and modern UI

## 🛠️ Tech Stack
- Frontend: Next.js, React, TypeScript
- Backend: Next.js Server Actions
- Database: PostgreSQL
- ORM: Prisma
- Authentication: Role-based access control
- Styling: Modern component-based UI

## ⚙️ Local Setup
1. Clone the repository
   ```bash
   git clone https://github.com/samjidpwb21-rgb/rash-college-app.git

