// Path: /backend/src/types/property.ts

export interface PropertyFilters {
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  furnished?: boolean;
  parking?: boolean;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  propertyType?: string;
  listingType?: string;
  rooms?: number;
  page?: number;
}
