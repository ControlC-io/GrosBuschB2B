-- CreateTable
CREATE TABLE "seasonal_shops" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_seasonal_shops" (
    "productId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,

    CONSTRAINT "product_seasonal_shops_pkey" PRIMARY KEY ("productId","shopId")
);

-- CreateIndex
CREATE UNIQUE INDEX "seasonal_shops_slug_key" ON "seasonal_shops"("slug");

-- CreateIndex
CREATE INDEX "seasonal_shops_startsAt_endsAt_idx" ON "seasonal_shops"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "product_seasonal_shops_shopId_idx" ON "product_seasonal_shops"("shopId");

-- AddForeignKey
ALTER TABLE "product_seasonal_shops" ADD CONSTRAINT "product_seasonal_shops_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_seasonal_shops" ADD CONSTRAINT "product_seasonal_shops_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "seasonal_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
