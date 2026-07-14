-- CreateTable
CREATE TABLE "LegalDoc" (
    "id" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAgreement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "agreeSource" TEXT NOT NULL DEFAULT 'register',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalDoc_docType_isActive_idx" ON "LegalDoc"("docType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDoc_docType_version_key" ON "LegalDoc"("docType", "version");

-- CreateIndex
CREATE INDEX "UserAgreement_userId_idx" ON "UserAgreement"("userId");

-- CreateIndex
CREATE INDEX "UserAgreement_docType_version_idx" ON "UserAgreement"("docType", "version");

-- AddForeignKey
ALTER TABLE "UserAgreement" ADD CONSTRAINT "UserAgreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAgreement" ADD CONSTRAINT "UserAgreement_docId_fkey" FOREIGN KEY ("docId") REFERENCES "LegalDoc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
