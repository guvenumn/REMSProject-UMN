"use client";

// Path: frontend/src/components/Layout/Header/UserMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Common/Button';

interface UserMenuProps {
  user?: {
    name: string;
    email: string;
    image?: string;
  } | null;
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/login">
          <Button variant="outline" size="default" className="h-10 w-20">
            Login
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="default" size="default" className="h-10 w-30">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-medium text-foreground">
              👤
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg z-20 border border-border">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-foreground-light truncate">{user.email}</p>
          </div>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/messages"
            className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
            onClick={() => setIsOpen(false)}
          >
            Messages
          </Link>
          <Link
            href="/favorites"
            className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
            onClick={() => setIsOpen(false)}
          >
            Favorites
          </Link>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent"
            onClick={() => {
              // Handle logout logic here
              setIsOpen(false);
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export { UserMenu };