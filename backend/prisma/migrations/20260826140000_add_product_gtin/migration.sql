-- AlterTable
ALTER TABLE "products" ADD COLUMN "gtin" TEXT;
ALTER TABLE "products" ADD COLUMN "barcodeFixed" BOOLEAN NOT NULL DEFAULT false;
