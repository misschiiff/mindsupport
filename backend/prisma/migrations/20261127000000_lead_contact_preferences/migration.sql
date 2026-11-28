ALTER TABLE "Lead"
  ADD COLUMN "preferredFormat" VARCHAR(24),
  ADD COLUMN "availability" VARCHAR(40),
  ADD COLUMN "preferredDay" VARCHAR(16),
  ADD COLUMN "circumstances" JSONB,
  ADD COLUMN "contactConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "contactConsentAt" TIMESTAMPTZ(6);
