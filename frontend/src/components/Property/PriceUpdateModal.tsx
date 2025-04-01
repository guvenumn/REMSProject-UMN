// src/components/Property/PriceUpdateModal.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import { TextArea } from "@/components/Common/TextArea";
// Define the price change reason type directly since we don't have access to the types file
type PriceChangeReason =
  | "MARKET_ADJUSTMENT"
  | "PRICE_REDUCTION"
  | "PRICE_INCREASE"
  | "RELISTING"
  | "APPRAISAL_ADJUSTMENT"
  | "OTHER";

// Import only what we need from propertyClient
import { updateProperty } from "@/utils/propertyClient";

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  propertyId: string;
  currentPrice: number;
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  propertyId,
  currentPrice,
}) => {
  const [price, setPrice] = useState(currentPrice);
  const [reason, setReason] = useState<PriceChangeReason>("MARKET_ADJUSTMENT");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [priceDirection, setPriceDirection] = useState<
    "increase" | "decrease" | "same"
  >("same");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrice(currentPrice);
      setReason("MARKET_ADJUSTMENT");
      setNotes("");
      setError("");
      setPriceDirection("same");
    }
  }, [isOpen, currentPrice]);

  // Determine price change direction
  useEffect(() => {
    if (price > currentPrice) {
      setPriceDirection("increase");
      setReason("PRICE_INCREASE");
      if (!notes) {
        setNotes(
          `Price increased from $${currentPrice.toLocaleString()} to $${price.toLocaleString()}`
        );
      }
    } else if (price < currentPrice) {
      setPriceDirection("decrease");
      setReason("PRICE_REDUCTION");
      if (!notes) {
        setNotes(
          `Price reduced from $${currentPrice.toLocaleString()} to $${price.toLocaleString()}`
        );
      }
    } else {
      setPriceDirection("same");
    }
  }, [price, currentPrice, notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (price <= 0) {
      setError("Please enter a valid price");
      setIsSubmitting(false);
      return;
    }

    if (price === currentPrice) {
      setError("The new price must be different from the current price");
      setIsSubmitting(false);
      return;
    }

    try {
      // Only update the price property since priceHistory is not in the Property type
      await updateProperty(propertyId, { price });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      console.error("Failed to update property price:", err);
      setError("Failed to update property price. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Update Property Price</h2>
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
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Current Price
            </label>
            <div className="text-lg font-semibold">
              ${currentPrice.toLocaleString()}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              New Price <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min={1}
              required
              className={
                priceDirection === "increase"
                  ? "border-red-300 focus:border-red-500"
                  : priceDirection === "decrease"
                  ? "border-green-300 focus:border-green-500"
                  : ""
              }
            />
            {priceDirection !== "same" && (
              <p
                className={`text-sm mt-1 ${
                  priceDirection === "increase"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {priceDirection === "increase" ? "Increasing" : "Decreasing"}{" "}
                price by ${Math.abs(price - currentPrice).toLocaleString()} (
                {(
                  (Math.abs(price - currentPrice) / currentPrice) *
                  100
                ).toFixed(1)}
                %)
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Reason for Change <span className="text-red-500">*</span>
            </label>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value as PriceChangeReason)}
              options={[
                { label: "Market Adjustment", value: "MARKET_ADJUSTMENT" },
                { label: "Price Reduction", value: "PRICE_REDUCTION" },
                { label: "Price Increase", value: "PRICE_INCREASE" },
                { label: "Relisting", value: "RELISTING" },
                {
                  label: "Appraisal Adjustment",
                  value: "APPRAISAL_ADJUSTMENT",
                },
                { label: "Other", value: "OTHER" },
              ]}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about the price change"
              rows={3}
            />
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
            <Button
              type="submit"
              disabled={isSubmitting || price === currentPrice || price <= 0}
              className={
                priceDirection === "increase"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {isSubmitting ? "Updating..." : "Update Price"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceUpdateModal;
