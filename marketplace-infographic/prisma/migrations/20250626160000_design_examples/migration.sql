-- CreateTable
CREATE TABLE "DesignExample" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "resultJson" TEXT NOT NULL,
    "fontId" TEXT,
    "badgeId" TEXT,
    "appliedStyle" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignExample_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DesignExample" ADD CONSTRAINT "DesignExample_fontId_fkey" FOREIGN KEY ("fontId") REFERENCES "LibraryFont"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignExample" ADD CONSTRAINT "DesignExample_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "LibraryBadge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
