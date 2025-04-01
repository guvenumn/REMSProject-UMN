// frontend/src/types/property.ts

export type PropertyStatus = "AVAILABLE" | "PENDING" | "SOLD" | "RENTED";
export type PropertyType = "HOUSE" | "TOWNHOUSE" | "CONDO" | "APARTMENT";
export type ListingType = "SALE" | "RENT";
export type PriceChangeReason =
  | "INITIAL_LISTING"
  | "PRICE_REDUCTION"
  | "PRICE_INCREASE"
  | "RELISTING"
  | "APPRAISAL_ADJUSTMENT"
  | "MARKET_ADJUSTMENT"
  | "OTHER";

export interface PriceHistoryItem {
  id?: string;
  propertyId?: string;
  price: number;
  previousPrice?: number;
  date: string; // ISO date string
  reason?: PriceChangeReason;
  notes?: string;
  event?: string; // For display purposes
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface PropertyImage {
  id: string;
  url: string;
  orderIndex?: number;
  alt?: string;
}

export interface PropertyFeature {
  id: string;
  name: string;
  value?: string;
}

export interface PropertyListItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  size?: number;
  area?: number;
  rooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  location?: string;
  address?: string;
  status?: string;
  featured?: boolean;
  propertyType?: PropertyType;
  listingType?: ListingType;
  agentId?: string;
  agent?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
  images?: (PropertyImage | string)[];
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  priceHistory?: PriceHistoryItem[];
  // Add these fields for map functionality
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PropertyDetail extends PropertyListItem {
  features?: PropertyFeature[];
  // Latitude and longitude already included from PropertyListItem
}

export interface PropertyFilters {
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  propertyType?: PropertyType[];
  listingType?: ListingType;
  status?: PropertyStatus[];
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface PropertiesResponse {
  properties: PropertyListItem[];
  total: number;
  pages: number;
  currentPage: number;
}

export interface SavedPropertyItem {
  id: string;
  userId: string;
  propertyId: string;
  property: PropertyListItem;
  createdAt: string;
}

export interface SavedPropertiesResponse {
  properties: SavedPropertyItem[];
  total: number;
}

export interface NewPropertyInput {
  title: string;
  description: string;
  price: number;
  size: number;
  rooms: number;
  bathrooms: number;
  location: string;
  address: string;
  status?: PropertyStatus;
  featured?: boolean;
  propertyType: PropertyType;
  listingType: ListingType;
  features?: Omit<PropertyFeature, "id" | "propertyId">[];
  images?: string[]; // Array of image URLs or file paths
  priceHistory?: PriceHistoryItem[]; // Initial price history
  priceChangeReason?: PriceChangeReason; // Reason for price change when updating
  priceChangeNotes?: string; // Notes for price change when updating
  // Add these fields for map functionality
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PriceUpdateInput {
  price: number;
  reason: PriceChangeReason;
  notes?: string;
}

export type UpdatePropertyInput = Partial<NewPropertyInput> & {
  id: string;
};

export interface PropertyPriceHistoryResponse {
  propertyId: string;
  title: string;
  currentPrice: number;
  priceHistory: PriceHistoryItem[];
}

// Interface for map property representation
export interface MapProperty {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
}
