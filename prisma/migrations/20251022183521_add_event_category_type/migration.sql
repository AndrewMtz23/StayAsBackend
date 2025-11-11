/*
  Warnings:

  - You are about to drop the column `category` on the `CalendarEvent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."CalendarEvent_category_idx";

-- AlterTable
ALTER TABLE "CalendarEvent" DROP COLUMN "category";

-- CreateTable
CREATE TABLE "CalendarEventCategoryRelation" (
    "id" SERIAL NOT NULL,
    "calendarEventId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "CalendarEventCategoryRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEventCategoryRelation_calendarEventId_idx" ON "CalendarEventCategoryRelation"("calendarEventId");

-- CreateIndex
CREATE INDEX "CalendarEventCategoryRelation_categoryId_idx" ON "CalendarEventCategoryRelation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventCategoryRelation_calendarEventId_categoryId_key" ON "CalendarEventCategoryRelation"("calendarEventId", "categoryId");

-- AddForeignKey
ALTER TABLE "CalendarEventCategoryRelation" ADD CONSTRAINT "CalendarEventCategoryRelation_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventCategoryRelation" ADD CONSTRAINT "CalendarEventCategoryRelation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ActivityCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
