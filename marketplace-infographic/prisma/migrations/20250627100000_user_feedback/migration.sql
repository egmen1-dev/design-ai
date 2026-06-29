-- User thumbs up/down on generated images
ALTER TABLE "GeneratedImage" ADD COLUMN IF NOT EXISTS "userFeedback" TEXT;
ALTER TABLE "GeneratedImage" ADD COLUMN IF NOT EXISTS "feedbackAt" TIMESTAMP(3);
