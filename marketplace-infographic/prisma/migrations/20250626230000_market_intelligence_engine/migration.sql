-- CreateTable
CREATE TABLE "MarketCategoryKnowledge" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "marketVersion" INTEGER NOT NULL DEFAULT 1,
    "productsAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "knowledgeContext" TEXT NOT NULL,
    "marketStatistics" JSONB NOT NULL,
    "marketWeaknesses" JSONB NOT NULL,
    "marketOpportunities" JSONB NOT NULL,
    "designRecommendations" JSONB NOT NULL,
    "trendHistory" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketCategoryKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketKnowledgeHistory" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "marketVersion" INTEGER NOT NULL,
    "oldStatistics" JSONB,
    "newStatistics" JSONB NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketKnowledgeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketCategoryKnowledge_category_key" ON "MarketCategoryKnowledge"("category");

-- CreateIndex
CREATE INDEX "MarketCategoryKnowledge_category_updatedAt_idx" ON "MarketCategoryKnowledge"("category", "updatedAt");

-- CreateIndex
CREATE INDEX "MarketKnowledgeHistory_category_createdAt_idx" ON "MarketKnowledgeHistory"("category", "createdAt");
