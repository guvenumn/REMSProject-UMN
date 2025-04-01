// src/components/Property/AddPropertyModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import { TextArea } from "@/components/Common/TextArea";
import { PropertyType, ListingType, PriceChangeReason } from "@/types/property";
import Image from "next/image";

// Define proper types for the property data
interface PropertyFormData {
  title: string;
  description: string;
  price: number;
  rooms: number;
  bathrooms: number;
  size: number;
  location: string;
  address: string;
  status: string;
  propertyType: PropertyType;
  listingType: ListingType;
  featured: boolean;
  images: string[];
  imageFiles: File[];
  priceChangeReason?: PriceChangeReason;
  priceChangeNotes?: string;
  priceHistory?: Array<{
    price: number;
    date: string;
    event: string;
    reason: string;
  }>;
}

// Define proper types for the props
interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  initialData?: Partial<PropertyFormData>;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [oldPrice, setOldPrice] = useState(0);
  const [rooms, setRooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [size, setSize] = useState(0);
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [propertyType, setPropertyType] = useState<PropertyType>("HOUSE");
  const [listingType, setListingType] = useState<ListingType>("SALE");
  const [featured, setFeatured] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // State for file uploads
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Keep backward compatibility with URL-based images
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  const [priceChangeReason, setPriceChangeReason] =
    useState<PriceChangeReason>("INITIAL_LISTING");
  const [priceChangeNotes, setPriceChangeNotes] = useState("");
  const [isPriceChanged, setIsPriceChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setPrice(initialData.price || 0);
        setOldPrice(initialData.price || 0);
        setRooms(initialData.rooms || 0);
        setBathrooms(initialData.bathrooms || 0);
        setSize(initialData.size || 0);
        setLocation(initialData.location || "");
        setAddress(initialData.address || "");
        setStatus(initialData.status || "AVAILABLE");
        setPropertyType(initialData.propertyType || "HOUSE");
        setListingType(initialData.listingType || "SALE");
        setFeatured(initialData.featured || false);
        setImages(initialData.images || []);
        setIsPriceChanged(false);
        setPriceChangeReason("MARKET_ADJUSTMENT");
        setPriceChangeNotes("");
      } else {
        // Reset form
        setTitle("");
        setDescription("");
        setPrice(0);
        setOldPrice(0);
        setRooms(0);
        setBathrooms(0);
        setSize(0);
        setLocation("");
        setAddress("");
        setStatus("AVAILABLE");
        setPropertyType("HOUSE");
        setListingType("SALE");
        setFeatured(false);
        setImages([]);
        setImageUrl("");
        setIsPriceChanged(false);
        setPriceChangeReason("INITIAL_LISTING");
        setPriceChangeNotes("");
      }
      // Reset file upload state
      setSelectedFiles([]);
      setImagePreviewUrls([]);

      setError("");
    }
  }, [isOpen, initialData]);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all object URLs to avoid memory leaks
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]); // Fix the missing dependency

  // Check if price changed
  useEffect(() => {
    if (initialData && initialData.price) {
      setIsPriceChanged(price !== oldPrice);

      // Set default reason based on price change direction
      if (price !== oldPrice) {
        if (price > oldPrice) {
          setPriceChangeReason("PRICE_INCREASE");
          setPriceChangeNotes(
            `Price increased from $${oldPrice.toLocaleString()} to $${price.toLocaleString()}`
          );
        } else if (price < oldPrice) {
          setPriceChangeReason("PRICE_REDUCTION");
          setPriceChangeNotes(
            `Price reduced from $${oldPrice.toLocaleString()} to $${price.toLocaleString()}`
          );
        }
      }
    }
  }, [price, oldPrice, initialData]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;

    if (!files || files.length === 0) return;

    handleFiles(files);
  };

  // Process selected files
  const handleFiles = (files: FileList) => {
    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Only accept image files
      if (!file.type.startsWith("image/")) continue;

      newFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  // Remove a selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setImagePreviewUrls((prev) => {
      const newUrls = [...prev];
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const dt = e.dataTransfer;
    const files = dt.files;

    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, []);

  // Handle URL-based image (for backward compatibility)
  const handleAddImage = () => {
    if (imageUrl && !images.includes(imageUrl)) {
      setImages([...images, imageUrl]);
      setImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!title || !location || !address || price <= 0) {
      setError("Please fill all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const propertyData: PropertyFormData = {
        title,
        description,
        price,
        rooms,
        bathrooms,
        size,
        location,
        address,
        status,
        propertyType,
        listingType,
        featured,
        images: [...images],
        imageFiles: selectedFiles, // Pass the selected files to the submit handler
      };

      // Include price history data
      if (initialData) {
        if (isPriceChanged) {
          propertyData.priceChangeReason = priceChangeReason;
          propertyData.priceChangeNotes = priceChangeNotes;
        }
      } else {
        // For new properties
        propertyData.priceHistory = [
          {
            price,
            date: new Date().toISOString(),
            event: "Initially listed",
            reason: "INITIAL_LISTING",
          },
        ];
      }

      await onSubmit(propertyData);
      onClose();
    } catch (err) {
      console.error("Error submitting property:", err);
      setError("Failed to save property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {initialData ? "Edit Property" : "Add New Property"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Property title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
                required
              />
            </div>

            {initialData && isPriceChanged && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reason for Price Change
                  </label>
                  <Select
                    value={priceChangeReason}
                    onChange={(e) =>
                      setPriceChangeReason(e.target.value as PriceChangeReason)
                    }
                    options={[
                      {
                        label: "Market Adjustment",
                        value: "MARKET_ADJUSTMENT",
                      },
                      { label: "Price Reduction", value: "PRICE_REDUCTION" },
                      { label: "Price Increase", value: "PRICE_INCREASE" },
                      { label: "Relisting", value: "RELISTING" },
                      {
                        label: "Appraisal Adjustment",
                        value: "APPRAISAL_ADJUSTMENT",
                      },
                      { label: "Other", value: "OTHER" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price Change Notes
                  </label>
                  <Input
                    value={priceChangeNotes}
                    onChange={(e) => setPriceChangeNotes(e.target.value)}
                    placeholder="Reason for price change"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Bedrooms <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                min={0}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Bathrooms <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                min={0}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Size (sq ft) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                min={0}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Property Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={propertyType}
                onChange={(e) =>
                  setPropertyType(e.target.value as PropertyType)
                }
                options={[
                  { label: "House", value: "HOUSE" },
                  { label: "Townhouse", value: "TOWNHOUSE" },
                  { label: "Condo", value: "CONDO" },
                  { label: "Apartment", value: "APARTMENT" },
                ]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Listing Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as ListingType)}
                options={[
                  { label: "For Sale", value: "SALE" },
                  { label: "For Rent", value: "RENT" },
                ]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { label: "Available", value: "AVAILABLE" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Sold", value: "SOLD" },
                  { label: "Rented", value: "RENTED" },
                ]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Featured Property
              </label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 text-primary rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show in featured properties
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full property address"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Property description"
                required
              />
            </div>

            {/* Drag & Drop Image Upload Area */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Property Images
              </label>

              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer mb-4 ${
                  isDragging
                    ? "border-primary bg-primary bg-opacity-5"
                    : "border-gray-300"
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="property-images"
                />
                <label htmlFor="property-images" className="cursor-pointer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mx-auto text-gray-400 mb-2"
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
                  <p className="text-gray-500">
                    Drag & drop images here, or{" "}
                    <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports: JPG, PNG, GIF, WebP (Max 5MB each)
                  </p>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Selected Images:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full h-24 relative rounded-md overflow-hidden">
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy Image URL Input (for backward compatibility) */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  Or add images by URL:
                </p>
                <div className="flex space-x-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImage}
                    variant="outline"
                    disabled={!imageUrl}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* URL-based Images */}
              {images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">URL Images:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full h-24 relative rounded-lg overflow-hidden">
                          <Image
                            src={img}
                            alt={`Property image ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover"
                            onError={() => {
                              // Handle image load errors
                              // We can't directly modify the src in Next.js Image component
                              // This would need a different approach in production
                              console.error(`Image failed to load: ${img}`);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : initialData
                ? "Update Property"
                : "Add Property"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;
