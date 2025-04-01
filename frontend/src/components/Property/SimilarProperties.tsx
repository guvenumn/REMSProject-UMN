// src/components/Property/SimilarProperties.tsx
import React from "react";
import { Card } from "../Common/Card";
import { PropertyCard } from "./PropertyCard";
import { PropertyListItem } from "@/utils/propertyClient";

type SimilarPropertiesProps = {
  properties: PropertyListItem[];
  currentPropertyId: string;
};

export const SimilarProperties: React.FC<SimilarPropertiesProps> = ({
  properties,
  currentPropertyId,
}) => {
  // Filter out the current property
  const similarProperties = properties.filter(
    (property) => property.id !== currentPropertyId
  );

  if (similarProperties.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Similar Properties</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {similarProperties.slice(0, 3).map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </Card>
  );
};

export default SimilarProperties;
