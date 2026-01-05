-- CreateTable
CREATE TABLE "subject_color_map" (
    "id" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "colorIndex" INTEGER NOT NULL,

    CONSTRAINT "subject_color_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subject_color_map_subjectId_key" ON "subject_color_map"("subjectId");

-- CreateIndex
CREATE INDEX "subject_color_map_subjectId_idx" ON "subject_color_map"("subjectId");

-- AddForeignKey
ALTER TABLE "subject_color_map" ADD CONSTRAINT "subject_color_map_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
