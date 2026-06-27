-- CreateTable
CREATE TABLE "ParametricBadge" (
    "id" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "model" JSONB NOT NULL,
    "styleTags" TEXT[],
    "categories" TEXT[],
    "compatibleFonts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "compatiblePalettes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "successScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametricBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetFontProfile" (
    "id" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "fontId" TEXT,
    "tags" TEXT[],
    "marketplaceReadability" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "visualImpact" DOUBLE PRECISION NOT NULL DEFAULT 65,
    "successScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "categories" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetFontProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetPalette" (
    "id" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "secondary" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "contrast" DOUBLE PRECISION NOT NULL,
    "premiumScore" DOUBLE PRECISION NOT NULL,
    "marketplaceScore" DOUBLE PRECISION NOT NULL,
    "emotion" TEXT,
    "categories" TEXT[],
    "successScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetPalette_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetShapeStyle" (
    "id" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" JSONB NOT NULL,
    "styleFamily" TEXT NOT NULL,
    "categories" TEXT[],
    "successScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetShapeStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetSyncLog" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "category" TEXT,
    "itemsAdded" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParametricBadge_assetKey_key" ON "ParametricBadge"("assetKey");

-- CreateIndex
CREATE INDEX "ParametricBadge_successScore_idx" ON "ParametricBadge"("successScore");

-- CreateIndex
CREATE INDEX "ParametricBadge_categories_idx" ON "ParametricBadge"("categories");

-- CreateIndex
CREATE UNIQUE INDEX "AssetFontProfile_assetKey_key" ON "AssetFontProfile"("assetKey");

-- CreateIndex
CREATE INDEX "AssetFontProfile_successScore_idx" ON "AssetFontProfile"("successScore");

-- CreateIndex
CREATE UNIQUE INDEX "AssetPalette_assetKey_key" ON "AssetPalette"("assetKey");

-- CreateIndex
CREATE INDEX "AssetPalette_marketplaceScore_idx" ON "AssetPalette"("marketplaceScore");

-- CreateIndex
CREATE UNIQUE INDEX "AssetShapeStyle_assetKey_key" ON "AssetShapeStyle"("assetKey");

-- CreateIndex
CREATE INDEX "AssetSyncLog_completedAt_idx" ON "AssetSyncLog"("completedAt");
