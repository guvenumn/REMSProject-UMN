// Path: frontend/src/components/Layout/Footer.tsx
import React from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("bg-gray-50 border-t border-gray-200", className)}>
      <div className="container mx-auto px-4 py-8">
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">REMS</h3>
            <p className="text-gray-600 text-sm">
              Find your dream property with our comprehensive real estate management platform.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/properties" 
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  Properties
                </Link>
              </li>
              <li>
                <Link 
                  href="/search" 
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  Search
                </Link>
              </li>
              <li>
                <Link 
                  href="/agents" 
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  Agents
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  href="/careers" 
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div> */}

        <p className="text-gray-600 text-sm">
          © {currentYear} REMS. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export { Footer };
