-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "url" TEXT,
    "articleText" TEXT,
    "title" TEXT,
    "author" TEXT,
    "siteName" TEXT,
    "publishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "verdict" TEXT,
    "confidence" DOUBLE PRECISION,
    "reasoning" TEXT,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3),
    "similarity" DOUBLE PRECISION,
    "relevance" DOUBLE PRECISION,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "explanation" JSONB NOT NULL,
    "manipulation" JSONB NOT NULL,
    "missingContext" JSONB NOT NULL,
    "sourceCredibility" JSONB NOT NULL,
    "overallVerdict" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investigation_status_idx" ON "Investigation"("status");

-- CreateIndex
CREATE INDEX "Claim_investigationId_idx" ON "Claim"("investigationId");

-- CreateIndex
CREATE INDEX "Evidence_claimId_idx" ON "Evidence"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_investigationId_key" ON "Report"("investigationId");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

