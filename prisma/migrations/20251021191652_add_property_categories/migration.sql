-- AlterTable
ALTER TABLE "ActivityCategory" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'ACTIVITY';

-- CreateTable
CREATE TABLE "PropertyCategoryRelation" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "PropertyCategoryRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyCategoryRelation_propertyId_idx" ON "PropertyCategoryRelation"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyCategoryRelation_categoryId_idx" ON "PropertyCategoryRelation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyCategoryRelation_propertyId_categoryId_key" ON "PropertyCategoryRelation"("propertyId", "categoryId");

-- AddForeignKey
ALTER TABLE "PropertyCategoryRelation" ADD CONSTRAINT "PropertyCategoryRelation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyCategoryRelation" ADD CONSTRAINT "PropertyCategoryRelation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ActivityCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
