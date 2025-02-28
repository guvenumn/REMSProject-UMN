// Path: frontend/src/components/Property/PropertyCard.tsx
import React from 'react';
import Link from 'next/link';
import { cn } from '@/utils/cn';

interface PropertyCardProps {
  property: {
    id: string | number;
    title?: string;
    price: number;
    beds: number;
    baths: number;
    location: string;
    sqft?: number;
    image?: string;
  };
  className?: string;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, className }) => {
  const { id, title, price, beds, baths, location, sqft, image } = property;
  
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <Link href={`/properties/${id}`}>
      <div className={cn("rounded-lg border border-border overflow-hidden bg-white hover:shadow-md transition-shadow duration-200", className)}>
        <div 
          className="h-40 bg-accent-dark bg-cover bg-center" 
          style={image ? { backgroundImage: `url(${image})` } : {}}
        />
        <div className="p-4">
          <div className="bg-foreground text-white py-1 px-4 rounded inline-block mb-2">
            {formattedPrice}
          </div>
          {title && <div className="font-medium text-foreground mb-1">{title}</div>}
          <div className="text-sm text-foreground">
            {beds} {beds === 1 ? 'bed' : 'beds'} • {baths} {baths === 1 ? 'bath' : 'baths'} 
            {sqft && ` • ${sqft.toLocaleString()} sqft`}
          </div>
          <div className="text-sm text-foreground-light mt-1">{location}</div>
        </div>
      </div>
    </Link>
  );
};

export { PropertyCard };