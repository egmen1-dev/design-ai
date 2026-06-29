-- CreateTable
CREATE TABLE "DesignPattern" (
    "id" TEXT NOT NULL,
    "patternKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "layoutTemplate" TEXT NOT NULL,
    "compositionType" TEXT NOT NULL,
    "backgroundType" TEXT NOT NULL,
    "lightingType" TEXT NOT NULL,
    "fontFamily" TEXT NOT NULL,
    "badgeStyle" TEXT NOT NULL,
    "productScale" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
    "textDensity" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "negativeSpace" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "primaryColor" TEXT NOT NULL DEFAULT '#1a1a2e',
    "secondaryColor" TEXT NOT NULL DEFAULT '#f97316',
    "designScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctrPrediction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "usages" INTEGER NOT NULL DEFAULT 0,
    "successWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationHistory" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "ollamaJson" JSONB,
    "scenePlanner" JSONB,
    "layoutEngine" JSONB,
    "font" TEXT,
    "badge" TEXT,
    "backgroundPrompt" TEXT,
    "designScore" DOUBLE PRECISION,
    "artDirectorScore" DOUBLE PRECISION,
    "marketplaceScore" DOUBLE PRECISION,
    "photographerScore" DOUBLE PRECISION,
    "userLiked" BOOLEAN,
    "generatedImage" TEXT,
    "generatedImageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignPattern_patternKey_key" ON "DesignPattern"("patternKey");

-- CreateIndex
CREATE INDEX "DesignPattern_category_successWeight_idx" ON "DesignPattern"("category", "successWeight");

-- CreateIndex
CREATE INDEX "DesignPattern_category_layoutTemplate_idx" ON "DesignPattern"("category", "layoutTemplate");

-- CreateIndex
CREATE INDEX "GenerationHistory_category_createdAt_idx" ON "GenerationHistory"("category", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationHistory_createdAt_idx" ON "GenerationHistory"("createdAt");
