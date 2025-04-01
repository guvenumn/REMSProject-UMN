// src/components/Property/FeaturesList.tsx
"use client";

import React from "react";
import { Card } from "../Common/Card";

type Feature = {
  id: string;
  name: string;
  category: string;
};

type FeaturesListProps = {
  features: Feature[];
};

export const FeaturesList: React.FC<FeaturesListProps> = ({ features }) => {
  if (!features || features.length === 0) {
    return null;
  }

  // Group features by category
  const featuresByCategory = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Features & Amenities</h2>

      <div className="space-y-6">
        {Object.entries(featuresByCategory).map(
          ([category, categoryFeatures]) => (
            <div key={category}>
              <h3 className="text-base font-medium mb-2 capitalize">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                {categoryFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </Card>
  );
};
