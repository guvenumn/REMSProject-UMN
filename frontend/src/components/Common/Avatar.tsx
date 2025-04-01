// Path: src/components/Common/Avatar.tsx
import React from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface AvatarProps {
  src: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = "md",
  className,
}) => {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  // If no image is provided, show a placeholder with initials
  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary text-white font-medium",
          sizeClasses[size],
          className
        )}
      >
        {getInitials(alt)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-gray-100",
        sizeClasses[size],
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={64}
        height={64}
        className="h-full w-full object-cover"
      />
    </div>
  );
};
