-- CreateEnum
CREATE TYPE "PriceChangeReason" AS ENUM ('INITIAL_LISTING', 'PRICE_REDUCTION', 'PRICE_INCREASE', 'RELISTING', 'APPRAISAL_ADJUSTMENT', 'MARKET_ADJUSTMENT', 'OTHER');

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "previousPrice" DECIMAL(65,30),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" "PriceChangeReason" NOT NULL DEFAULT 'INITIAL_LISTING',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
