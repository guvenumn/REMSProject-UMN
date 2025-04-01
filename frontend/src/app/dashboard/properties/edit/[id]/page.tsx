// file /frontend/src/app/dashboard/properties/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image"; // Import Next.js Image component

import { Button } from "@/components/Common/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Common/Card";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import {
  getPropertyById,
  updateProperty,
  deletePropertyImage,
  uploadPropertyImages,
  // Import the Property and PropertyImage types from propertyClient
  Property as ServerProperty,
  PropertyImage as ServerPropertyImage,
} from "@/utils/propertyClient";
import { getImageUrl } from "@/utils/uploadClient";
import { useAuth } from "@/contexts/AuthContext";
import useRoleAuthorization from "@/hooks/useRoleAuthorization";
import AccessDenied from "@/components/AccessDenied";
import Loading from "@/components/Loading";

// Define PropertyStatus enum to match backend expectations
enum PropertyStatus {
  AVAILABLE = "AVAILABLE",
  PENDING = "PENDING",
  SOLD = "SOLD",
  RENTED = "RENTED",
}

// Define PropertyType enum
enum PropertyType {
  HOUSE = "HOUSE",
  TOWNHOUSE = "TOWNHOUSE",
  CONDO = "CONDO",
  APARTMENT = "APARTMENT",
}

// Define ListingType enum
enum ListingType {
  SALE = "SALE",
  RENT = "RENT",
}

// Define the PropertyImage interface for the component
interface PropertyImage {
  id: string;
  url: string;
  // Add the missing properties from the server PropertyImage
  propertyId?: string;
  createdAt?: string;
}

// Define the Property interface for the component
interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  size: number;
  rooms: number;
  bathrooms: number;
  location: string;
  address: string;
  status: PropertyStatus;
  featured: boolean;
  propertyType: PropertyType;
  listingType: ListingType;
  latitude?: number;
  longitude?: number;
  images: PropertyImage[];
}

const statusOptions = [
  { label: "Available", value: PropertyStatus.AVAILABLE },
  { label: "Pending", value: PropertyStatus.PENDING },
  { label: "Sold", value: PropertyStatus.SOLD },
  { label: "Rented", value: PropertyStatus.RENTED },
];

// Property type options
const propertyTypeOptions = [
  { label: "House", value: PropertyType.HOUSE },
  { label: "Townhouse", value: PropertyType.TOWNHOUSE },
  { label: "Condo", value: PropertyType.CONDO },
  { label: "Apartment", value: PropertyType.APARTMENT },
];

// Listing type options
const listingTypeOptions = [
  { label: "For Sale", value: ListingType.SALE },
  { label: "For Rent", value: ListingType.RENT },
];

export default withSuspense(function EditPropertyPage() {
  const { isAuthorized, isLoading: authLoading } = useRoleAuthorization([
    "ADMIN",
    "AGENT",
  ]);

  const params = useParams();
  const propertyId = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  // Remove unused variable reference or utilize it
  const {
    /* user, */
  } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    size: "",
    rooms: "",
    bathrooms: "",
    location: "",
    address: "",
    status: PropertyStatus.AVAILABLE,
    featured: false,
    propertyType: PropertyType.HOUSE,
    listingType: ListingType.SALE,
    latitude: "",
    longitude: "",
  });

  // Debug propertyId
  useEffect(() => {
    console.log("Property ID from params:", propertyId);
  }, [propertyId]);

  // Fetch property details
  useEffect(() => {
    // Only fetch data if user is authorized
    if (!isAuthorized) return;

    const fetchPropertyData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!propertyId) {
          throw new Error("Property ID is required");
        }

        console.log("Fetching property with ID:", propertyId);
        const fetchedProperty = await getPropertyById(propertyId);
        console.log("Fetched property data:", fetchedProperty);

        // Check if property data is valid before setting state
        if (!fetchedProperty) {
          throw new Error("Failed to retrieve property data from server");
        }

        // Handle API response that might be wrapped in a data property
        // Fix the 'data' property access
        const serverPropertyData: ServerProperty =
          "data" in fetchedProperty
            ? (fetchedProperty.data as ServerProperty)
            : (fetchedProperty as ServerProperty);

        // Map server property to component property
        const propertyData: Property = {
          id: serverPropertyData.id,
          title: serverPropertyData.title,
          description: serverPropertyData.description,
          price: serverPropertyData.price,
          size: serverPropertyData.size,
          rooms: serverPropertyData.rooms,
          bathrooms: serverPropertyData.bathrooms,
          location: serverPropertyData.location,
          address: serverPropertyData.address,
          status: serverPropertyData.status as PropertyStatus,
          featured: serverPropertyData.featured,
          propertyType: serverPropertyData.propertyType as PropertyType,
          listingType: serverPropertyData.listingType as ListingType,
          latitude: serverPropertyData.latitude,
          longitude: serverPropertyData.longitude,
          images: [],
        };

        // Process and fix image URLs if needed
        if (
          serverPropertyData.images &&
          Array.isArray(serverPropertyData.images)
        ) {
          propertyData.images = serverPropertyData.images.map(
            (img: ServerPropertyImage) => ({
              id: img.id,
              url: getImageUrl(img.url),
              propertyId: img.propertyId,
              createdAt: img.createdAt,
            })
          );
        }

        setProperty(propertyData);

        // Initialize form data safely
        setFormData({
          title: propertyData.title || "",
          description: propertyData.description || "",
          price: propertyData.price?.toString() || "",
          size: propertyData.size?.toString() || "",
          rooms: propertyData.rooms?.toString() || "",
          bathrooms: propertyData.bathrooms?.toString() || "",
          location: propertyData.location || "",
          address: propertyData.address || "",
          status: propertyData.status || PropertyStatus.AVAILABLE,
          featured: propertyData.featured || false,
          propertyType: propertyData.propertyType || PropertyType.HOUSE,
          listingType: propertyData.listingType || ListingType.SALE,
          latitude: propertyData.latitude?.toString() || "",
          longitude: propertyData.longitude?.toString() || "",
        });
      } catch (err) {
        console.error("Failed to fetch property:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load property details: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyData();
    } else {
      setError("No property ID provided");
      setIsLoading(false);
    }
  }, [propertyId, isAuthorized]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      validFiles.push(files[i]);
    }

    setSelectedImages((prev) => [...prev, ...validFiles]);

    // Create preview URLs for new images
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const handleRemoveExistingImage = async (imageId: string) => {
    if (!isAuthorized) return;

    setIsLoading(true);
    try {
      await deletePropertyImage(propertyId, imageId);
      // Update property state to remove the deleted image
      setProperty((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.filter((img) => img.id !== imageId),
        };
      });
    } catch (err) {
      console.error("Failed to delete image:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Please try again.";
      setSubmitError(`Failed to delete image: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setSelectedImages((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });

    // Also remove the preview URL and release the object URL
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls((prev) => {
      const newUrls = [...prev];
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      // Format property data as ServerProperty type
      const propertyData: Partial<ServerProperty> = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        size: parseFloat(formData.size) || 0,
        rooms: parseInt(formData.rooms, 10) || 0,
        bathrooms: parseInt(formData.bathrooms, 10) || 0,
        location: formData.location,
        address: formData.address,
        status: formData.status as PropertyStatus,
        featured: Boolean(formData.featured),
        propertyType: formData.propertyType as PropertyType,
        listingType: formData.listingType as ListingType,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude
          ? parseFloat(formData.longitude)
          : undefined,
      };

      console.log("Updating property with data:", propertyData);

      try {
        // Update property with better error handling
        const updateResult = await updateProperty(propertyId, propertyData);
        console.log("Property update success:", updateResult);

        // Upload new images if any
        if (selectedImages.length > 0) {
          const formData = new FormData();
          selectedImages.forEach((file) => {
            formData.append("images", file);
          });

          await uploadPropertyImages(propertyId, formData);
        }

        // Navigate back to properties list
        router.push("/dashboard/properties");
      } catch (updateErr) {
        console.error(
          "Failed to update property in try/catch block:",
          updateErr
        );
        throw updateErr; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error("Failed to update property:", err);

      // More comprehensive error message with details
      let errorMessage = "Failed to update property";

      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "message" in err.response.data
      ) {
        errorMessage += `: ${String(err.response.data.message)}`;
      } else if (
        typeof err === "object" &&
        err !== null &&
        Object.keys(err as object).length === 0
      ) {
        errorMessage += ": Network error or server timeout";
      } else {
        errorMessage += ": Please try again";
      }

      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authorization
  if (authLoading) {
    return <Loading message="Checking permissions..." />;
  }

  // Show unauthorized message if the user doesn't have permission
  if (!isAuthorized) {
    return (
      <AccessDenied
        title="Edit Access Restricted"
        message="You don't have permission to edit properties. This action is restricted to administrators and agents."
      />
    );
  }

  // Show a more descriptive loading state
  if (isLoading && !property) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Loading Property Details</h1>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show a more helpful error state
  if (error && !property) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error Loading Property</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          {error}
        </div>
        <p className="mb-4">
          There was a problem loading the property details. This could be due
          to:
        </p>
        <ul className="list-disc ml-6 mb-6">
          <li>The property ID may be invalid</li>
          <li>The property may have been deleted</li>
          <li>There might be a connection issue with the server</li>
        </ul>
        <Button onClick={() => router.push("/dashboard/properties")}>
          Back to Properties
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Property</h1>

        <div className="mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/properties")}
          >
            Cancel
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          {submitError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Property Title"
              name="title"
              placeholder="Modern Apartment in Downtown"
              value={formData.title}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            <div>
              <label className="block text-sm font-medium text-foreground-light mb-1">
                Description
              </label>
              <textarea
                name="description"
                className="w-full p-2 border rounded-md border-accent-dark bg-accent"
                rows={4}
                placeholder="Describe the property..."
                value={formData.description}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            {/* Property Type and Listing Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Property Type"
                name="propertyType"
                options={propertyTypeOptions}
                value={formData.propertyType}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <Select
                label="Listing Type"
                name="listingType"
                options={listingTypeOptions}
                value={formData.listingType}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Price ($)"
                name="price"
                type="number"
                placeholder="599000"
                value={formData.price}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <Input
                label="Size (sq ft)"
                name="size"
                type="number"
                placeholder="1200"
                value={formData.size}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Rooms"
                name="rooms"
                type="number"
                placeholder="3"
                value={formData.rooms}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <Input
                label="Bathrooms"
                name="bathrooms"
                type="number"
                placeholder="2"
                value={formData.bathrooms}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <Input
              label="Location"
              name="location"
              placeholder="Cityville, State"
              value={formData.location}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            <Input
              label="Address"
              name="address"
              placeholder="123 Main St, Cityville, State 12345"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Latitude (optional)"
                name="latitude"
                type="text"
                placeholder="40.7128"
                value={formData.latitude}
                onChange={handleChange}
                disabled={isLoading}
              />

              <Input
                label="Longitude (optional)"
                name="longitude"
                type="text"
                placeholder="-74.0060"
                value={formData.longitude}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                name="status"
                options={statusOptions}
                value={formData.status}
                onChange={handleChange}
                disabled={isLoading}
              />

              <div className="flex items-center space-x-2 mt-8">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="h-4 w-4"
                  disabled={isLoading}
                />
                <label htmlFor="featured" className="text-sm">
                  Featured Property
                </label>
              </div>
            </div>

            {/* Existing Images */}
            {property?.images && property.images.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground-light">
                  Current Images
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {property.images.map((image) => (
                    <div key={image.id} className="relative group">
                      {/* Using Next.js Image component */}
                      <Image
                        src={image.url}
                        alt="Property"
                        width={200}
                        height={150}
                        className="w-full h-24 object-cover rounded-md"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "/images/properties/property-placeholder.jpeg";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(image.id)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isLoading}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground-light">
                Add New Images
              </label>

              <div className="border-2 border-dashed border-accent-dark rounded-md p-4">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="property-images"
                  disabled={isLoading}
                />

                <label
                  htmlFor="property-images"
                  className="flex flex-col items-center justify-center cursor-pointer py-6"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    Click to upload new images
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, GIF or WebP (max 5MB per file)
                  </p>
                </label>
              </div>

              {/* Show selected new images */}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">New Images:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isLoading}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/properties")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Property"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});
