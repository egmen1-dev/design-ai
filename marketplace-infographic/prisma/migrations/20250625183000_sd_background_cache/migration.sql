-- AlterTable
ALTER TABLE "GeneratedImage" ADD COLUMN IF NOT EXISTS "generatedJson" TEXT;
ALTER TABLE "GeneratedImage" ADD COLUMN IF NOT EXISTS "backgroundUrl" TEXT;
ALTER TABLE "GeneratedImage" ADD COLUMN IF NOT EXISTS "productCutout" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "BackgroundCache" (
    "id" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackgroundCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BackgroundCache_promptHash_key" ON "BackgroundCache"("promptHash");
