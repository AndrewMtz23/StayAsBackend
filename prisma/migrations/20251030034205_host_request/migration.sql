-- CreateTable
CREATE TABLE "HostRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "initialMessage" TEXT NOT NULL,
    "motivation" TEXT,
    "experience" TEXT,
    "phone" TEXT,
    "alternativeEmail" TEXT,
    "hasProperty" BOOLEAN,
    "propertyType" TEXT,
    "propertyAddress" TEXT,
    "propertyCity" TEXT,
    "propertyState" TEXT,
    "estimatedCapacity" INTEGER,
    "hasBusinessLicense" BOOLEAN NOT NULL DEFAULT false,
    "taxId" TEXT,
    "businessName" TEXT,
    "availableFrom" TIMESTAMP(3),
    "identificationDoc" TEXT,
    "propertyPhotos" TEXT[],
    "additionalDocs" TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostRequest_userId_key" ON "HostRequest"("userId");

-- CreateIndex
CREATE INDEX "HostRequest_userId_idx" ON "HostRequest"("userId");

-- CreateIndex
CREATE INDEX "HostRequest_status_idx" ON "HostRequest"("status");

-- CreateIndex
CREATE INDEX "HostRequest_submittedAt_idx" ON "HostRequest"("submittedAt");

-- AddForeignKey
ALTER TABLE "HostRequest" ADD CONSTRAINT "HostRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
