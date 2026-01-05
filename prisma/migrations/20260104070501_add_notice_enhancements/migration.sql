-- AlterTable
ALTER TABLE "notices" ADD COLUMN     "colorIndex" INTEGER DEFAULT 0,
ADD COLUMN     "departmentId" UUID,
ADD COLUMN     "imageUrl" VARCHAR(500);

-- CreateIndex
CREATE INDEX "notices_departmentId_idx" ON "notices"("departmentId");

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
