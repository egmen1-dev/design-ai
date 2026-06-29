CREATE TABLE "TrendIntelligence" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "trends" JSONB NOT NULL,
    "styleSignals" JSONB NOT NULL,
    "colorTrends" JSONB NOT NULL,
    "fontTrends" JSONB NOT NULL,
    "layoutTrends" JSONB NOT NULL,
    "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrendIntelligence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrendIntelligence_category_key" ON "TrendIntelligence"("category");
CREATE INDEX "TrendIntelligence_trendScore_idx" ON "TrendIntelligence"("trendScore");

CREATE TABLE "TrendSyncLog" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "category" TEXT,
    "sourcesUpdated" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrendSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrendSyncLog_completedAt_idx" ON "TrendSyncLog"("completedAt");
