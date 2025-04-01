// file: /var/www/rems/frontend/src/components/Property/ImageGallery.tsx
"use client";

import React, { useState } from "react";
import { getImageUrl } from "@/utils/uploadClient"; // Fixed import path

type ImageType = {
  id: string;
  url: string;
  alt?: string;
};

interface ImageGalleryProps {
  images: ImageType[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // If no images are provided, show a default placeholder
  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-[500px] bg-gray-200 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          No images available
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentImage = images[currentIndex];

  // Get the full URL for the current image
  const imageUrl = getImageUrl(currentImage.url);
  console.log(`Gallery image URL: ${imageUrl}`);

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt={currentImage.alt || "Property image"}
          className="object-cover w-full h-full"
          crossOrigin="anonymous"
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition shadow-md"
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition shadow-md"
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative h-20 rounded-md overflow-hidden ${
                index === currentIndex
                  ? "ring-2 ring-primary"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <img
                src={getImageUrl(image.url)}
                alt={image.alt || `Thumbnail ${index + 1}`}
                className="object-cover w-full h-full"
                crossOrigin="anonymous"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
