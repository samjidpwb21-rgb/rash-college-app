-- CreateTable
CREATE TABLE "mdc_courses" (
    "id" UUID NOT NULL,
    "courseName" VARCHAR(200) NOT NULL,
    "homeDepartmentId" UUID NOT NULL,
    "mdcDepartmentId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "studentIds" UUID[],
    "facultyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdc_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mdc_attendance_records" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "period" INTEGER NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mdcCourseId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "markedBy" UUID NOT NULL,

    CONSTRAINT "mdc_attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mdc_courses_facultyId_idx" ON "mdc_courses"("facultyId");

-- CreateIndex
CREATE INDEX "mdc_courses_homeDepartmentId_idx" ON "mdc_courses"("homeDepartmentId");

-- CreateIndex
CREATE INDEX "mdc_courses_mdcDepartmentId_idx" ON "mdc_courses"("mdcDepartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "mdc_courses_homeDepartmentId_mdcDepartmentId_year_semester_key" ON "mdc_courses"("homeDepartmentId", "mdcDepartmentId", "year", "semester");

-- CreateIndex
CREATE INDEX "mdc_attendance_records_studentId_date_idx" ON "mdc_attendance_records"("studentId", "date");

-- CreateIndex
CREATE INDEX "mdc_attendance_records_markedBy_date_idx" ON "mdc_attendance_records"("markedBy", "date");

-- CreateIndex
CREATE INDEX "mdc_attendance_records_mdcCourseId_date_idx" ON "mdc_attendance_records"("mdcCourseId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "mdc_attendance_records_mdcCourseId_studentId_date_period_key" ON "mdc_attendance_records"("mdcCourseId", "studentId", "date", "period");

-- AddForeignKey
ALTER TABLE "mdc_courses" ADD CONSTRAINT "mdc_courses_homeDepartmentId_fkey" FOREIGN KEY ("homeDepartmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdc_courses" ADD CONSTRAINT "mdc_courses_mdcDepartmentId_fkey" FOREIGN KEY ("mdcDepartmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdc_courses" ADD CONSTRAINT "mdc_courses_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdc_attendance_records" ADD CONSTRAINT "mdc_attendance_records_mdcCourseId_fkey" FOREIGN KEY ("mdcCourseId") REFERENCES "mdc_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdc_attendance_records" ADD CONSTRAINT "mdc_attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdc_attendance_records" ADD CONSTRAINT "mdc_attendance_records_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "faculty_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
