-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "eventEndDate" TIMESTAMP(3),
ADD COLUMN     "eventStartDate" TIMESTAMP(3),
ADD COLUMN     "included" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DECIMAL(10,8),
ADD COLUMN     "longitude" DECIMAL(11,8),
ADD COLUMN     "state" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ActivityCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityCategoryRelation" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "ActivityCategoryRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategory_name_key" ON "ActivityCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategory_slug_key" ON "ActivityCategory"("slug");

-- CreateIndex
CREATE INDEX "ActivityCategoryRelation_activityId_idx" ON "ActivityCategoryRelation"("activityId");

-- CreateIndex
CREATE INDEX "ActivityCategoryRelation_categoryId_idx" ON "ActivityCategoryRelation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategoryRelation_activityId_categoryId_key" ON "ActivityCategoryRelation"("activityId", "categoryId");

-- AddForeignKey
ALTER TABLE "ActivityCategoryRelation" ADD CONSTRAINT "ActivityCategoryRelation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCategoryRelation" ADD CONSTRAINT "ActivityCategoryRelation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ActivityCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
