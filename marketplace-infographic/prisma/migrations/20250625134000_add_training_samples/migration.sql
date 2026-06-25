CREATE TABLE IF NOT EXISTS "TrainingSample" (
    "id" SERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "correctedJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingSample_pkey" PRIMARY KEY ("id")
);
