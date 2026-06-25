ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "credits" INTEGER NOT NULL DEFAULT 3;

CREATE TABLE IF NOT EXISTS "CreditPurchase" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "credits" INTEGER NOT NULL,
    "amountCents" INTEGER,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "credits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "amountCents" INTEGER;
ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CreditPurchase_userId_fkey'
    ) THEN
        ALTER TABLE "CreditPurchase"
        ADD CONSTRAINT "CreditPurchase_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
