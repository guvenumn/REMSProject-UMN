// Path: /src/components/Search/AddressMapView.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { PropertyListItem } from "@/utils/propertyClient";
import { getImageUrl } from "@/utils/uploadClient";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamically import the Leaflet components with no SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);

// Define props interface
interface AddressMapViewProps {
  properties: PropertyListItem[];
  height?: string;
  width?: string;
  selectedProperty?: PropertyListItem | null;
}

// Define an interface for geocoded property data
interface GeocodedInfo {
  lat: number;
  lon: number;
  display_name?: string;
}

interface GeocodedProperty extends PropertyListItem {
  geocoded?: GeocodedInfo;
}

const AddressMapView: React.FC<AddressMapViewProps> = ({
  properties,
  height = "600px",
  width = "100%",
  selectedProperty,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [geocodedProperties, setGeocodedProperties] = useState<
    GeocodedProperty[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllersRef = useRef<AbortController[]>([]);
  const leafletLoaded = useRef(false);
  const cssLoaded = useRef(false);

  // Geocode addresses to get coordinates
  useEffect(() => {
    if (!isMounted) return;

    const geocodeAddresses = async () => {
      setLoading(true);
      setError(null);

      // Cancel any ongoing requests
      abortControllersRef.current.forEach((controller) => controller.abort());
      abortControllersRef.current = [];

      try {
        const validProperties = properties.filter(
          (property) => property.address || property.location
        );

        if (validProperties.length === 0) {
          setGeocodedProperties([]);
          setLoading(false);
          setError("No properties with addresses found");
          return;
        }

        const geocodingPromises = validProperties.map(async (property) => {
          const address = property.address || property.location || "";

          // Skip empty addresses
          if (!address.trim()) {
            return { ...property } as GeocodedProperty;
          }

          try {
            const controller = new AbortController();
            abortControllersRef.current.push(controller);
            const signal = controller.signal;

            // Add a delay to avoid rate limiting
            await new Promise((resolve) =>
              setTimeout(resolve, Math.random() * 150)
            );

            const encodedAddress = encodeURIComponent(address);
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
              { signal }
            );

            if (!response.ok) {
              console.warn(
                `Error geocoding address: ${address}`,
                response.statusText
              );
              return { ...property } as GeocodedProperty;
            }

            const data = await response.json();

            if (data && data.length > 0) {
              return {
                ...property,
                geocoded: {
                  lat: parseFloat(data[0].lat),
                  lon: parseFloat(data[0].lon),
                  display_name: data[0].display_name,
                },
              } as GeocodedProperty;
            }

            return { ...property } as GeocodedProperty;
          } catch (err) {
            if ((err as Error).name !== "AbortError") {
              console.warn(`Error geocoding address: ${address}`, err);
            }
            return { ...property } as GeocodedProperty;
          }
        });

        const results = await Promise.all(geocodingPromises);

        // Filter out properties with no coordinates
        const validResults = results.filter(
          (property) => property.geocoded?.lat && property.geocoded?.lon
        );

        if (validResults.length === 0) {
          setError("No properties could be geocoded");
        }

        setGeocodedProperties(results);
      } catch (err) {
        console.error("Error geocoding addresses:", err);
        setError("Failed to geocode addresses");
      } finally {
        setLoading(false);
      }
    };

    geocodeAddresses();

    // Cleanup function
    return () => {
      abortControllersRef.current.forEach((controller) => controller.abort());
    };
  }, [properties, isMounted]);

  // Load Leaflet CSS and initialize
  useEffect(() => {
    setIsMounted(true);

    // Add Leaflet CSS if not already added
    if (!cssLoaded.current) {
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      linkElement.integrity =
        "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      linkElement.crossOrigin = "";

      document.head.appendChild(linkElement);
      cssLoaded.current = true;
    }

    // Import and setup Leaflet only on client-side
    if (!leafletLoaded.current) {
      import("leaflet").then((L) => {
        // Fix the icon issue
        interface LeafletIconWithPrivateProps extends L.Icon.Default {
          _getIconUrl?: unknown;
        }

        if (
          (L.Icon.Default.prototype as LeafletIconWithPrivateProps)._getIconUrl
        ) {
          delete (L.Icon.Default.prototype as LeafletIconWithPrivateProps)
            ._getIconUrl;
        }

        L.Icon.Default.mergeOptions({
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        leafletLoaded.current = true;
      });
    }

    // Clean up function
    return () => {
      // We don't remove the CSS link on unmount as it might be used elsewhere
    };
  }, []);

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get property image URL
  const getPropertyImageUrl = (property: PropertyListItem) => {
    let originalUrl = "";

    // If there are images in the property object
    if (property.images && property.images.length > 0) {
      // Check if images is an array of objects with url property
      if (
        typeof property.images[0] === "object" &&
        property.images[0] !== null &&
        "url" in property.images[0]
      ) {
        originalUrl = property.images[0].url;
      }
      // If images is an array of strings
      else if (typeof property.images[0] === "string") {
        originalUrl = property.images[0];
      }
    }
    // If there's an imageUrl directly on the property
    else if (property.imageUrl) {
      originalUrl = property.imageUrl;
    }

    // If we have a URL, use the proper imported utility function
    if (originalUrl) {
      return getImageUrl(originalUrl);
    }

    // Default placeholder if no image is found
    return "/images/properties/property-placeholder.jpeg";
  };

  // Calculate map center
  const getMapCenter = () => {
    // Default center (United States)
    const defaultCenter = [37.0902, -95.7129] as [number, number];

    // If selected property has coordinates, center on it
    if (selectedProperty) {
      const selectedGeocodedProperty = geocodedProperties.find(
        (p) => p.id === selectedProperty.id && p.geocoded
      );

      if (selectedGeocodedProperty?.geocoded) {
        return [
          selectedGeocodedProperty.geocoded.lat,
          selectedGeocodedProperty.geocoded.lon,
        ] as [number, number];
      }
    }

    // If no selected property or it doesn't have coordinates,
    // center on the first property with coordinates
    const firstWithCoordinates = geocodedProperties.find((p) => p.geocoded);
    if (firstWithCoordinates?.geocoded) {
      return [
        firstWithCoordinates.geocoded.lat,
        firstWithCoordinates.geocoded.lon,
      ] as [number, number];
    }

    return defaultCenter;
  };

  // Calculate appropriate zoom level
  const getZoomLevel = () => {
    // If only one property, zoom in more
    if (geocodedProperties.filter((p) => p.geocoded).length === 1) {
      return 15;
    }

    // If properties are all near a specific location, zoom appropriately
    if (properties.some((p) => p.location === properties[0].location)) {
      return 13;
    }

    // Default zoom for multiple properties
    return 10;
  };

  // If not mounted or still loading, show loading state
  if (!isMounted || loading) {
    return (
      <div
        style={{ height, width }}
        className="bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Filter properties that have been successfully geocoded
  const mappableProperties = geocodedProperties.filter(
    (property) => property.geocoded?.lat && property.geocoded?.lon
  );

  // If no mappable properties, show error
  if (mappableProperties.length === 0) {
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
          <p className="text-gray-600">
            {error ||
              "None of the current properties have valid addresses for mapping."}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            (Found {properties.length} properties, but none could be geocoded)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width }}>
      <MapContainer
        center={getMapCenter()}
        zoom={getZoomLevel()}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {mappableProperties.map(
          (property) =>
            property.geocoded && (
              <Marker
                key={property.id}
                position={[property.geocoded.lat, property.geocoded.lon]}
              >
                <Popup>
                  <div className="max-w-xs">
                    <div className="w-full h-28 bg-gray-200 mb-2 rounded overflow-hidden">
                      <Image
                        src={getPropertyImageUrl(property)}
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
            )
        )}
      </MapContainer>
    </div>
  );
};

export default AddressMapView;
