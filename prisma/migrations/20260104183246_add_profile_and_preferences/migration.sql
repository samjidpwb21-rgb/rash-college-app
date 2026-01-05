/*
  Warnings:

  - A unique constraint covering the columns `[libraryBarcode]` on the table `faculty_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[libraryBarcode]` on the table `student_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "faculty_profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bloodGroup" VARCHAR(5),
ADD COLUMN     "gender" VARCHAR(10),
ADD COLUMN     "libraryBarcode" VARCHAR(50);

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "bloodGroup" VARCHAR(5),
ADD COLUMN     "gender" VARCHAR(10),
ADD COLUMN     "libraryBarcode" VARCHAR(50);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profiles_libraryBarcode_key" ON "faculty_profiles"("libraryBarcode");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_libraryBarcode_key" ON "student_profiles"("libraryBarcode");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
