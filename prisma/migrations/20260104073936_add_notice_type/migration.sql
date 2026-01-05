-- CreateEnum
CREATE TYPE "NoticeType" AS ENUM ('ACADEMIC', 'EVENT', 'EXAM', 'GENERAL');

-- AlterTable
ALTER TABLE "notices" ADD COLUMN     "type" "NoticeType" NOT NULL DEFAULT 'GENERAL';
