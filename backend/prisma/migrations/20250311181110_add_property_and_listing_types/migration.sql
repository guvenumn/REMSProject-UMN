-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'TOWNHOUSE', 'CONDO', 'APARTMENT');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "listingType" "ListingType" NOT NULL DEFAULT 'SALE',
ADD COLUMN     "propertyType" "PropertyType" NOT NULL DEFAULT 'HOUSE';
