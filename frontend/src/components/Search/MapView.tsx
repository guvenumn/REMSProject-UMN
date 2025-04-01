// Path: /src/components/Search/MapView.tsx
"use client";

import React, { useEffect, useState } from "react";
import { PropertyListItem } from "@/utils/propertyClient";
import { getImageUrl } from "@/utils/uploadClient";
import Image from "next/image";

// Define props interface
interface MapViewProps {
  properties: PropertyListItem[];
  height?: string;
  width?: string;
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  selectedProperty?: PropertyListItem | null;
}

// Define better typed interfaces for Leaflet components
interface LeafletMapContainerProps {
  center: [number, number];
  zoom: number;
  style: React.CSSProperties;
  children: React.ReactNode;
}

interface LeafletTileLayerProps {
  attribution: string;
  url: string;
}

interface LeafletMarkerProps {
  position: [number, number];
  children?: React.ReactNode;
}

interface LeafletPopupProps {
  children: React.ReactNode;
}

// Define Leaflet modules interface with proper typing
interface LeafletModules {
  leaflet: {
    Icon: {
      Default: {
        prototype: object;
        mergeOptions: (options: Record<string, string>) => void;
      };
    };
  };
  reactLeaflet: {
    MapContainer: React.ComponentType<LeafletMapContainerProps>;
    TileLayer: React.ComponentType<LeafletTileLayerProps>;
    Marker: React.ComponentType<LeafletMarkerProps>;
    Popup: React.ComponentType<LeafletPopupProps>;
  };
}

// Create a client-only component
const MapViewClient: React.FC<MapViewProps> = (props) => {
  // This component only renders on the client
  const [isMounted, setIsMounted] = useState(false);
  const [leafletModules, setLeafletModules] = useState<LeafletModules | null>(
    null
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Dynamic import of leaflet modules
    const loadLeaflet = async () => {
      try {
        // Import modules dynamically to avoid SSR issues
        const leaflet = await import("leaflet");
        const reactLeaflet = await import("react-leaflet");

        // Fix the default marker icon issue
        // Using a type assertion to bypass the type incompatibility
        const L = leaflet as unknown as {
          Icon: {
            Default: {
              prototype: object;
              mergeOptions: (options: Record<string, string>) => void;
            };
          };
        };

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "/marker-icon-2x.png",
          iconUrl: "/marker-icon.png",
          shadowUrl: "/marker-shadow.png",
        });

        setLeafletModules({
          leaflet: L,
          reactLeaflet,
        });
      } catch (error) {
        console.error("Error loading Leaflet:", error);
        setLoadError("Failed to load map library. Please try again later.");
      }
    };

    loadLeaflet();
  }, []);

  const {
    properties,
    height = "600px",
    width = "100%",
    center,
    zoom = 12,
    selectedProperty,
  } = props;

  // Debug property coordinates
  useEffect(() => {
    if (properties.length > 0) {
      console.log(`Total properties: ${properties.length}`);

      // Ensure coordinates are properly parsed to numbers
      const propertiesWithCoords = properties.map((property) => {
        return {
          ...property,
          latitude:
            property.latitude !== undefined
              ? Number(property.latitude)
              : undefined,
          longitude:
            property.longitude !== undefined
              ? Number(property.longitude)
              : undefined,
        };
      });

      const withCoords = propertiesWithCoords.filter(
        (p) =>
          p.latitude !== undefined &&
          p.longitude !== undefined &&
          p.latitude !== null &&
          p.longitude !== null &&
          !isNaN(p.latitude) &&
          !isNaN(p.longitude)
      );

      console.log(`Properties with valid coordinates: ${withCoords.length}`);

      if (withCoords.length === 0 && properties.length > 0) {
        console.log(
          "Sample property data:",
          JSON.stringify(properties[0], null, 2)
        );
      } else if (withCoords.length > 0) {
        console.log(
          "Sample property with coordinates:",
          JSON.stringify(
            {
              id: withCoords[0].id,
              title: withCoords[0].title,
              latitude: withCoords[0].latitude,
              longitude: withCoords[0].longitude,
            },
            null,
            2
          )
        );
      }
    }
  }, [properties]);

  // Filter properties with valid coordinates and ensure they're numbers
  const validProperties = properties
    .map((property) => ({
      ...property,
      latitude:
        typeof property.latitude === "string"
          ? parseFloat(property.latitude)
          : property.latitude,
      longitude:
        typeof property.longitude === "string"
          ? parseFloat(property.longitude)
          : property.longitude,
    }))
    .filter(
      (p) =>
        p.latitude !== undefined &&
        p.longitude !== undefined &&
        p.latitude !== null &&
        p.longitude !== null &&
        !isNaN(Number(p.latitude)) &&
        !isNaN(Number(p.longitude))
    );

  // Get center coordinates
  const getMapCenter = (): [number, number] => {
    if (
      selectedProperty?.latitude &&
      selectedProperty?.longitude &&
      !isNaN(Number(selectedProperty.latitude)) &&
      !isNaN(Number(selectedProperty.longitude))
    ) {
      return [
        Number(selectedProperty.latitude),
        Number(selectedProperty.longitude),
      ];
    }

    if (validProperties.length > 0) {
      const property = validProperties[0];
      return [Number(property.latitude), Number(property.longitude)];
    }

    return [30.5852, -97.8945]; // Default: Leander, TX
  };

  const mapCenter = center || getMapCenter();

  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // If not mounted or leaflet modules not loaded, show loading state
  if (!isMounted || !leafletModules) {
    return (
      <div
        style={{
          height: height || "600px",
          width: width || "100%",
        }}
        className="bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"
      >
        <div className="text-gray-500">{loadError || "Loading map..."}</div>
      </div>
    );
  }

  // If no properties with coordinates, show empty state
  if (validProperties.length === 0) {
    return (
      <div
        style={{ height, width }}
        className="bg-gray-100 rounded-lg flex items-center justify-center"
      >
        <div className="text-center p-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-gray-400 mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <h3 className="text-lg font-medium mb-2">No mappable properties</h3>
          <p>
            None of the current properties have location coordinates for
            mapping.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            (Found {properties.length} properties, but none with valid
            coordinates)
          </p>
        </div>
      </div>
    );
  }

  // Destructure imported modules
  const { MapContainer, TileLayer, Marker, Popup } =
    leafletModules.reactLeaflet;

  // Render map with markers
  return (
    <div style={{ height, width }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProperties.map((property) => {
          // Ensure coordinates are numbers
          const lat = Number(property.latitude);
          const lng = Number(property.longitude);

          if (isNaN(lat) || isNaN(lng)) {
            return null;
          }

          return (
            <Marker key={property.id} position={[lat, lng]}>
              <Popup>
                <div className="max-w-xs">
                  <div className="w-full h-28 bg-gray-200 mb-2 rounded overflow-hidden">
                    {/* Use Next.js Image component with unoptimized prop */}
                    <Image
                      src={
                        property.images && property.images.length > 0
                          ? getImageUrl(
                              typeof property.images[0] === "object" &&
                                property.images[0] !== null &&
                                "url" in property.images[0]
                                ? property.images[0].url
                                : typeof property.images[0] === "string"
                                ? property.images[0]
                                : "/images/properties/property-placeholder.jpeg"
                            )
                          : "/images/properties/property-placeholder.jpeg"
                      }
                      alt={property.title}
                      className="w-full h-full object-cover"
                      width={200}
                      height={112}
                      unoptimized
                    />
                  </div>
                  <h3 className="text-lg font-semibold">{property.title}</h3>
                  <p className="text-md font-bold">
                    {formatPrice(property.price)}
                    {property.listingType === "RENT" && (
                      <span className="text-sm font-normal text-gray-500">
                        {" "}
                        /month
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {property.address || property.location}
                  </p>
                  <p className="text-sm my-1">
                    {property.beds || property.rooms} bed •{" "}
                    {property.baths || property.bathrooms} bath •{" "}
                    {property.area || property.size} ft²
                  </p>
                  <a
                    href={`/properties/${property.id}`}
                    className="mt-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm block text-center"
                  >
                    View Details
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

// Export the client-only component
const MapView: React.FC<MapViewProps> = (props) => {
  return <MapViewClient {...props} />;
};

export default MapView;
