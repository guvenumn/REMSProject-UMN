// src/utils/withSuspense.tsx
"use client";

import React, { Suspense, ComponentType } from "react";

// Default loading component
const DefaultLoading = () => (
  <div className="w-full h-full min-h-[200px] flex items-center justify-center">
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

/**
 * Higher-order component that wraps a component in a Suspense boundary
 *
 * @param Component The component to wrap
 * @param LoadingComponent Optional custom loading component
 * @returns A new component wrapped in Suspense
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  LoadingComponent: React.ComponentType = DefaultLoading
) {
  return function WithSuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Usage example:
 *
 * // Import your component and the withSuspense HOC
 * import MyComponent from './MyComponent';
 * import { withSuspense } from '@/utils/withSuspense';
 *
 * // Create a wrapped version of your component
 * const MyComponentWithSuspense = withSuspense(MyComponent);
 *
 * // Use the wrapped component in your page
 * export default function MyPage() {
 *   return <MyComponentWithSuspense />;
 * }
 */
