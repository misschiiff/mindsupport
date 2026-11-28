CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

CREATE TABLE "OutboundEmail" (
  "id" UUID NOT NULL,
  "leadId" UUID NOT NULL,
  "bookingId" UUID,
  "toEmail" VARCHAR(254) NOT NULL,
  "idempotencyKey" VARCHAR(256) NOT NULL,
  "category" VARCHAR(32) NOT NULL,
  "subject" VARCHAR(160) NOT NULL,
  "textBody" TEXT NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttemptAt" TIMESTAMPTZ(6),
  "sentAt" TIMESTAMPTZ(6),
  "lastErrorCode" VARCHAR(80),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "OutboundEmail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OutboundEmail_idempotencyKey_key" ON "OutboundEmail"("idempotencyKey");
CREATE INDEX "OutboundEmail_status_nextAttemptAt_idx" ON "OutboundEmail"("status", "nextAttemptAt");
CREATE INDEX "OutboundEmail_leadId_createdAt_idx" ON "OutboundEmail"("leadId", "createdAt");

ALTER TABLE "OutboundEmail"
  ADD CONSTRAINT "OutboundEmail_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "OutboundEmail_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
