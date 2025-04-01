import NextImage from "next/image";
import { getImageUrl } from "@/utils/uploadClient";

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: "contain" | "cover" | "fill";
  priority?: boolean;
  placeholder?: "blur" | "empty";
  onError?: () => void;
}

export const Image = ({
  src,
  alt,
  width,
  height,
  className,
  objectFit = "cover",
  priority = false,
  placeholder = "empty",
  onError,
}: ImageProps) => {
  // Process the source URL to handle various formats
  const processedSrc = getImageUrl(src);

  // Fallback image
  const fallbackSrc = "/images/placeholder.jpeg";

  // Handle error
  const handleError = () => {
    if (onError) onError();
  };

  return (
    <NextImage
      src={processedSrc || fallbackSrc}
      alt={alt}
      width={width || 500}
      height={height || 300}
      className={className}
      style={{ objectFit }}
      priority={priority}
      placeholder={placeholder}
      onError={handleError}
    />
  );
};

export default Image;
