import React from "react";
import { Search, Plus, User, ShoppingBag, Menu, LogOut, ArrowLeftRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onProfileClick: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoggedIn: boolean;
  user: { name: string; email: string; avatar: string } | null;
  isAdmin?: boolean;
}

export function Header({ currentPage, onNavigate, onProfileClick, onLogout, searchQuery, onSearchChange, isLoggedIn, user, isAdmin }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-blue-100 backdrop-blur supports-[backdrop-filter]:bg-blue-100/90">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate('home')}
        >
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="font-semibold">UniMarket</span>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-input-background"
            />
          </div>
        </div>

        {/* Navigation - removed My Items per request */}

        {/* Action Buttons */}
        {isLoggedIn && user ? (
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('admin')}
                className="hidden sm:flex items-center gap-2"
              >
                <span className="font-semibold">Admin Dashboard</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => onNavigate('sell')}
                  className="hidden sm:flex"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('exchange-requests')}
                  className="hidden sm:flex items-center gap-2"
                  title="Exchange Requests"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span className="hidden lg:inline">Exchanges</span>
                </Button>
              </>
            )}

            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={onProfileClick}>
              <img
                src={user.avatar}
                alt={`${user.name} avatar`}
                className="h-6 w-6 rounded-full"
              />
              <span className="hidden sm:inline text-sm">{user.name}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={onLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onProfileClick}
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mobile Menu */}
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-input-background"
          />
        </div>
      </div>
    </header>
  );
}