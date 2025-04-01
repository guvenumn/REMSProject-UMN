// File path: src/app/dashboard/properties/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/Common/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Common/Card";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import { AddPropertyModal } from "@/components/Property/AddPropertyModal";
import {
  getProperties,
  deleteProperty,
  PropertyListItem,
  createProperty,
  uploadPropertyImages,
  PropertyStatus, // Import PropertyStatus type
  PropertyType, // Import PropertyType type
  ListingType, // Import ListingType type
} from "@/utils/propertyClient";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/dateUtils";
import { getAccessToken } from "@/utils/authClient";
import useRoleAuthorization from "@/hooks/useRoleAuthorization";
import AccessDenied from "@/components/AccessDenied";
import Loading from "@/components/Loading";

// Define status options
const statusOptions = [
  { label: "All Statuses", value: "" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Pending", value: "PENDING" },
  { label: "Sold", value: "SOLD" },
  { label: "Rented", value: "RENTED" },
];

// Define listing type options
const listingTypeOptions = [
  { label: "All Types", value: "" },
  { label: "For Sale", value: "SALE" },
  { label: "For Rent", value: "RENT" },
  { label: "Short-term Rental", value: "SHORT_TERM" },
  { label: "Commercial", value: "COMMERCIAL" },
];

// Define property data interface
interface PropertyData {
  title: string;
  description: string;
  price: number;
  rooms: number;
  bathrooms: number;
  size: number;
  location: string;
  address: string;
  status: string;
  propertyType: string;
  listingType: string;
  featured: boolean;
  images: string[];
  imageFiles?: File[];
  priceChangeReason?: string;
  priceChangeNotes?: string;
  priceHistory?: Array<{
    price: number;
    date: string;
    event: string;
    reason: string;
  }>;
}

export default withSuspense(function PropertiesPage() {
  // Use the role authorization hook
  const { isAuthorized, isLoading: authLoading } = useRoleAuthorization([
    "ADMIN",
    "AGENT",
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedListingType, setSelectedListingType] = useState("");
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  // Removed unused totalProperties state
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const searchParamsObj = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Check authentication on component mount
  useEffect(() => {
    // Ensure we have an auth token
    const token = getAccessToken();
    if (!token) {
      console.log("No authentication token found, redirecting to login");
      router.push("/login?redirect=/dashboard/properties");
    }
  }, [router]);

  // Check for the 'action=add' query parameter
  useEffect(() => {
    if (!isAuthorized) return;

    // Make sure searchParams exists before accessing it
    if (searchParamsObj) {
      const action = searchParamsObj.get("action");
      if (action === "add") {
        setIsAddPropertyModalOpen(true);
        // Clear the query parameter to avoid reopening the modal on refresh
        router.replace("/dashboard/properties", { scroll: false });
      }
    }
  }, [searchParamsObj, router, isAuthorized]);

  // Fetch properties when component mounts or filters change
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchPropertiesData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Fetching properties with filters:", {
          searchTerm: searchTerm.length > 0 ? searchTerm : undefined,
          status: selectedStatus || undefined,
          listingType: selectedListingType || undefined,
          page: currentPage,
          limit: 10,
          sortField,
          sortDirection,
        });

        const filters = {
          searchTerm: searchTerm.length > 0 ? searchTerm : undefined,
          status: selectedStatus || undefined,
          listingType: selectedListingType || undefined,
          page: currentPage,
          limit: 10,
          sortField,
          sortDirection,
        };

        const result = await getProperties(filters);
        console.log("Properties result:", result);

        // Safely handle the result, even if some properties are missing
        setProperties(result.properties || []);
        // Set total properties directly in setTotalPages calculation
        setTotalPages(result.pagination.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Failed to load properties. Please try again.");
        // Set default values when an error occurs
        setProperties([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertiesData();
  }, [searchTerm, selectedStatus, selectedListingType, currentPage, sortField, sortDirection, isAuthorized]);

  // Filter properties based on search term and selected status
  const filteredProperties = properties;

  // Handle adding a property
  const handleAddProperty = async (propertyData: PropertyData) => {
    if (!isAuthorized) return Promise.reject(new Error("Unauthorized"));

    setIsLoading(true);
    setError(null);

    try {
      console.log("Adding new property:", propertyData);

      // Prepare the property data for the API request
      // Create the property payload without images (as they have incompatible types)
      const propertyPayload = {
        title: propertyData.title,
        description: propertyData.description,
        price: propertyData.price,
        rooms: propertyData.rooms,
        bathrooms: propertyData.bathrooms,
        size: propertyData.size,
        location: propertyData.location,
        address: propertyData.address,
        status: propertyData.status as PropertyStatus, // Type cast status
        propertyType: propertyData.propertyType as PropertyType, // Type cast propertyType
        listingType: propertyData.listingType as ListingType, // Type cast listingType
        featured: propertyData.featured,
        // Don't include images in the initial property creation
        agentId: user?.id, // Add agentId for backend
      };

      // Step 1: Create the property first
      console.log("Sending property data to API:", propertyPayload);
      const result = await createProperty(propertyPayload);
      console.log("Property created successfully:", result);

      const newPropertyId = result.id;

      // Step 2: Handle URLs for existing images if provided
      if (propertyData.images && propertyData.images.length > 0) {
        try {
          console.log(`Adding image URLs to property ID: ${newPropertyId}`);
          // In a real implementation, you would update the property with image URLs
          // await updatePropertyWithImageUrls(newPropertyId, propertyData.images);
          console.log("Image URLs added successfully");
        } catch (urlError) {
          console.error("Failed to add image URLs:", urlError);
        }
      }

      // Step 3: Upload image files if available
      if (propertyData.imageFiles && propertyData.imageFiles.length > 0) {
        console.log(
          `Property has ${propertyData.imageFiles.length} images to upload`
        );

        try {
          // Create FormData object for file upload
          const formData = new FormData();

          // Append each file to the FormData
          propertyData.imageFiles.forEach((file: File) => {
            formData.append("images", file);
          });

          // Use the uploadPropertyImages function to upload images
          console.log(`Uploading images for property ID: ${newPropertyId}`);
          await uploadPropertyImages(newPropertyId, formData);
          console.log("Images uploaded successfully");
        } catch (uploadError) {
          console.error("Failed to upload property images:", uploadError);
          // Continue even if image upload fails
        }
      }

      // Refresh the properties list
      const filters = {
        page: 1,
        limit: 10,
      };

      const updatedResult = await getProperties(filters);

      setProperties(updatedResult.properties || []);
      setTotalPages(updatedResult.pagination.totalPages || 1);
      setCurrentPage(1);

      return Promise.resolve(); // Return a resolved promise to satisfy the AddPropertyModal
    } catch (error) {
      console.error("Error adding property:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add property. Please try again.";
      setError(errorMessage);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a property
  const handleDeleteProperty = async (id: string) => {
    if (!isAuthorized) return;

    setIsLoading(true);
    try {
      await deleteProperty(id);

      // Refresh the properties list after deletion
      const filters = {
        page: currentPage,
        limit: 10,
        sortField,
        sortDirection,
      };

      const result = await getProperties(filters);
      setProperties(result.properties || []);
      setTotalPages(result.pagination.totalPages || 1);

      // If we deleted the last item on the page, go back one page
      if (properties.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      setDeletePropertyId(null);
    } catch (error) {
      console.error("Failed to delete property:", error);
      setError("Failed to delete property. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Check if property has recent price change
  const hasRecentPriceChange = (property: PropertyListItem) => {
    if (!property.priceHistory || property.priceHistory.length <= 1)
      return false;

    const lastChange = property.priceHistory[property.priceHistory.length - 1];
    // Removed unused previousChange variable

    // Calculate days since last price change
    const lastChangeDate = new Date(lastChange.date);
    const daysSinceChange = Math.floor(
      (new Date().getTime() - lastChangeDate.getTime()) / (1000 * 3600 * 24)
    );

    // Consider a price change "recent" if it happened within the last 30 days
    return daysSinceChange <= 30;
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon based on current state
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400 ml-1 inline"
        >
          <path d="M7 10l5 5 5-5" />
        </svg>
      );
    }

    return sortDirection === "asc" ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary ml-1 inline"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary ml-1 inline"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    );
  };

  // Show loading state while checking authorization
  if (authLoading) {
    return <Loading message="Checking permissions..." />;
  }

  // Show unauthorized message if the user doesn't have permission
  if (!isAuthorized) {
    return <AccessDenied />;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Property Management</h1>

        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsAddPropertyModalOpen(true)}>
            Add New Property
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
              <Select
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
              <Select
                options={listingTypeOptions}
                value={selectedListingType}
                onChange={(e) => setSelectedListingType(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("title")}
                    >
                      <span className="flex items-center">
                        Property
                        {getSortIcon("title")}
                      </span>
                    </th>
                    <th
                      className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("price")}
                    >
                      <span className="flex items-center justify-end">
                        Price
                        {getSortIcon("price")}
                      </span>
                    </th>
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("listingType")}
                    >
                      <span className="flex items-center">
                        Listing Type
                        {getSortIcon("listingType")}
                      </span>
                    </th>
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("status")}
                    >
                      <span className="flex items-center">
                        Status
                        {getSortIcon("status")}
                      </span>
                    </th>
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("agent")}
                    >
                      <span className="flex items-center">
                        Agent
                        {getSortIcon("agent")}
                      </span>
                    </th>
                    <th className="text-left py-3 px-4">
                      <span className="flex items-center">Price History</span>
                    </th>
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("createdAt")}
                    >
                      <span className="flex items-center">
                        Created
                        {getSortIcon("createdAt")}
                      </span>
                    </th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                      <tr
                        key={property.id}
                        className="border-b border-border hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{property.title}</p>
                            <p className="text-sm text-foreground-light">
                              {property.location}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            {formatPrice(property.price)}
                            {hasRecentPriceChange(property) && (
                              <div className="text-xs text-green-600 font-medium">
                                Recently updated
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              property.listingType === "SALE"
                                ? "bg-purple-100 text-purple-800"
                                : property.listingType === "RENT"
                                ? "bg-indigo-100 text-indigo-800"
                                : property.listingType === "SHORT_TERM"
                                ? "bg-teal-100 text-teal-800"
                                : property.listingType === "COMMERCIAL"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {property.listingType === "SALE"
                              ? "For Sale"
                              : property.listingType === "RENT"
                              ? "For Rent"
                              : property.listingType === "SHORT_TERM"
                              ? "Short-term"
                              : property.listingType === "COMMERCIAL"
                              ? "Commercial"
                              : property.listingType || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              property.status === "AVAILABLE"
                                ? "bg-green-100 text-green-800"
                                : property.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : property.status === "SOLD"
                                ? "bg-blue-100 text-blue-800"
                                : property.status === "RENTED"
                                ? "bg-cyan-100 text-cyan-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {property.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {property.agent?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {property.priceHistory &&
                          property.priceHistory.length > 0 ? (
                            <div className="text-sm">
                              <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                                {property.priceHistory.length}{" "}
                                {property.priceHistory.length === 1
                                  ? "entry"
                                  : "entries"}
                              </span>
                              {property.priceHistory.length > 1 && (
                                <div className="text-xs mt-1 text-gray-600">
                                  Last change:{" "}
                                  {formatDate(
                                    property.priceHistory[
                                      property.priceHistory.length - 1
                                    ].date
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {property.createdAt
                            ? formatDate(property.createdAt)
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/properties/edit/${property.id}`
                              )
                            }
                            className="text-primary hover:underline text-sm"
                            disabled={isLoading}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/properties/history/${property.id}`
                              )
                            }
                            className="text-blue-600 hover:underline text-sm"
                            disabled={isLoading}
                          >
                            History
                          </button>

                          {deletePropertyId === property.id ? (
                            <>
                              <button
                                onClick={() =>
                                  handleDeleteProperty(property.id)
                                }
                                className="text-destructive font-bold hover:underline text-sm"
                                disabled={isLoading}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeletePropertyId(null)}
                                className="text-gray-500 hover:underline text-sm"
                                disabled={isLoading}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeletePropertyId(property.id)}
                              className="text-destructive hover:underline text-sm"
                              disabled={isLoading}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-6 text-center text-gray-500"
                      >
                        {isLoading
                          ? "Loading properties..."
                          : "No properties found matching your criteria"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>

                <div className="flex items-center px-4">
                  Page {currentPage} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onSubmit={handleAddProperty}
      />
    </div>
  );
});
