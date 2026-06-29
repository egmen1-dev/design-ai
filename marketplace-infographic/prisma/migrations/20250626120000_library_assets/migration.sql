-- CreateEnum
CREATE TYPE "FontCategory" AS ENUM ('sans_serif', 'serif', 'display', 'monospace');

-- CreateTable
CREATE TABLE "LibraryFont" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cssImport" TEXT NOT NULL,
    "fontFamily" TEXT NOT NULL,
    "category" "FontCategory" NOT NULL,
    "styleTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryFont_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryBadge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "htmlTemplate" TEXT NOT NULL,
    "svgTemplate" TEXT,
    "pngUrl" TEXT,
    "styleTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryBadge_pkey" PRIMARY KEY ("id")
);
