// Path: frontend/src/app/page.tsx
import React from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import Link from "next/link";

export default function Home() {
  return (
    <Layout variant="default" transparentHeader>
      {/* Hero Section */}
      <section className="relative h-[470px] bg-secondary ">
        <div className="container mx-auto px-4 py-20 items-center">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Find Your Dream Home
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Discover the perfect property with our extensive listings
            </p>

            {/* Search Box */}
            <div className="bg-white p-5 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-foreground-light">
                    Location
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      placeholder="Enter location"
                      className="w-full h-10 px-3 rounded bg-accent text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-foreground-light">
                    Property Type
                  </label>
                  <div className="mt-1">
                    <select className="w-full h-10 px-3 rounded bg-accent text-foreground">
                      <option>Any</option>
                      <option>House</option>
                      <option>Apartment</option>
                      <option>Condo</option>
                      <option>Land</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-foreground-light">
                    Price Range
                  </label>
                  <div className="mt-1 flex">
                    <select className="w-full h-10 px-3 rounded bg-accent text-foreground">
                      <option>Any</option>
                      <option>$100k - $200k</option>
                      <option>$200k - $300k</option>
                      <option>$300k - $500k</option>
                      <option>$500k+</option>
                    </select>
                    <Button className="ml-4 w-20">Search</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Categories */}
          <div className="mt-10 flex flex-wrap gap-4 items-center justify-center">
            <Button variant="pill" size="pill" className="ml-4 w-30">
              Houses
            </Button>
            <Button variant="pill" size="pill" className="ml-4 w-30">
              Apartments
            </Button>
            <Button variant="pill" size="pill" className="ml-4 w-30">
              Condos
            </Button>
            <Button variant="pill" size="pill" className="ml-4 w-30">
              Land
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Featured Properties
            </h2>
            <p className="text-sm text-foreground-light">
              Handpicked properties for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Property Card 1 */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="h-40 bg-accent-dark"></div>
              <div className="p-4">
                <div className="bg-foreground text-white py-1 px-4 rounded inline-block mb-2">
                  $599,000
                </div>
                <div className="text-sm text-foreground">3 beds • 2 baths</div>
                <div className="text-sm text-foreground-light">
                  123 Wonder St, City
                </div>
              </div>
            </div>

            {/* Property Card 2 */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="h-40 bg-accent-dark"></div>
              <div className="p-4">
                <div className="bg-foreground text-white py-1 px-4 rounded inline-block mb-2">
                  $725,000
                </div>
                <div className="text-sm text-foreground">4 beds • 3 baths</div>
                <div className="text-sm text-foreground-light">
                  456 Oak Ave, City
                </div>
              </div>
            </div>

            {/* Property Card 3 */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="h-40 bg-accent-dark"></div>
              <div className="p-4">
                <div className="bg-foreground text-white py-1 px-4 rounded inline-block mb-2">
                  $849,000
                </div>
                <div className="text-sm text-foreground">5 beds • 3 baths</div>
                <div className="text-sm text-foreground-light">
                  789 Pine St, City
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
