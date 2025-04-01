// Path: /frontend/src/components/Search/SortOptions.tsx

"use client";

import React from "react";
import { Select } from "../Common/Select";

export type SortOption = "newest" | "price_low" | "price_high" | "relevance";

type SortOptionsProps = {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
};

export const SortOptions: React.FC<SortOptionsProps> = ({
  currentSort,
  onSortChange,
}) => {
  const options = [
    { label: "Newest", value: "newest" },
    { label: "Price (Low to High)", value: "price_low" },
    { label: "Price (High to Low)", value: "price_high" },
    { label: "Relevance", value: "relevance" },
  ];

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="text-sm font-medium whitespace-nowrap"
      >
        Sort by:
      </label>
      <Select
        id="sort-select"
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="w-full max-w-[200px]"
        options={options}
      />
    </div>
  );
};

export default SortOptions;
