-- CreateTable
CREATE TABLE "syllabus" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "semesterId" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileUrl" VARCHAR(500) NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syllabus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "syllabus_departmentId_idx" ON "syllabus"("departmentId");

-- CreateIndex
CREATE INDEX "syllabus_semesterId_idx" ON "syllabus"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_departmentId_semesterId_key" ON "syllabus"("departmentId", "semesterId");

-- AddForeignKey
ALTER TABLE "syllabus" ADD CONSTRAINT "syllabus_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus" ADD CONSTRAINT "syllabus_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
