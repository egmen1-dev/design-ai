-- Design Genome AI — successful element combinations
CREATE TABLE "DesignGenome" (
    "id" TEXT NOT NULL,
    "genomeKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "customerIntent" TEXT,
    "heroConcept" TEXT,
    "genome" JSONB NOT NULL,
    "rankings" JSONB,
    "source" TEXT NOT NULL DEFAULT 'generated',
    "successWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.55,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignGenome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DesignGenome_genomeKey_key" ON "DesignGenome"("genomeKey");
CREATE INDEX "DesignGenome_category_successWeight_idx" ON "DesignGenome"("category", "successWeight");
