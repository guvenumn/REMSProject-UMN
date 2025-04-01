// src/components/Property/LocationMap.tsx

"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";

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

interface LocationMapProps {
  address: string;
  title?: string;
  latitude?: number;
  longitude?: number;
  height?: string;
  width?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  address,
  title,
  latitude,
  longitude,
  height = "400px",
  width = "100%",
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [coordinates, setCoordinates] = useState<LatLngExpression | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cssLoaded = useRef(false);

  // Geocode address to get coordinates
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    setIsMounted(true);

    // If coordinates are already provided, use them
    if (latitude && longitude) {
      setCoordinates([latitude, longitude]);
      setIsLoading(false);
      return;
    }

    // If no address, show error
    if (!address) {
      setError("No address provided");
      setIsLoading(false);
      return;
    }

    // Use OpenStreetMap's Nominatim API for geocoding
    // Note: For production use, consider using a paid geocoding service with better rate limits
    const fetchCoordinates = async () => {
      try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
        );

        if (!response.ok) {
          throw new Error("Geocoding API error");
        }

        const data = await response.json();

        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setError("Couldn't find coordinates for this address");
        }
      } catch (err) {
        console.error("Error geocoding address:", err);
        setError("Error finding location");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoordinates();
  }, [address, latitude, longitude]);

  // Load Leaflet CSS and fix icon issues
  useEffect(() => {
    // Only initialize on client-side
    if (!isMounted) return;

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
    import("leaflet").then((L) => {
      // Fix the icon issue using a more specific approach
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
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });

    // Clean up function to remove the CSS link when component unmounts
    return () => {
      if (cssLoaded.current) {
        const linkElement = document.querySelector(
          'link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]'
        );
        if (linkElement && linkElement.parentNode) {
          linkElement.parentNode.removeChild(linkElement);
        }
      }
    };
  }, [isMounted]);

  if (!isMounted || isLoading) {
    return (
      <div
        style={{ height, width }}
        className="flex items-center justify-center bg-gray-100 rounded-lg"
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div
        style={{ height, width }}
        className="flex items-center justify-center bg-gray-100 rounded-lg"
      >
        <p className="text-gray-500">{error || "Location map not available"}</p>
      </div>
    );
  }

  return (
    <div style={{ height, width }}>
      <MapContainer
        center={coordinates}
        zoom={15}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coordinates}>
          <Popup>
            <div>
              {title && <h3 className="font-semibold">{title}</h3>}
              <p>{address}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LocationMap;
