import { useState } from "react";
import { ItemCard, Item } from "./ItemCard";
import { CategoryFilter } from "./CategoryFilter";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface HomePageProps {
  items: Item[];
  searchQuery: string;
  onItemClick: (item: Item) => void;
  onRefresh?: () => void;
  currentUser?: { email: string } | null;
}

export function HomePage({ items, searchQuery, onItemClick, onRefresh, currentUser }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Filter and sort items (only show available items, exclude user's own items)
  const filteredItems = items.filter(item => {
    const isAvailable = item.status === 'available';
    const isNotOwnItem = !currentUser || item.ownerId !== currentUser.email;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return isAvailable && isNotOwnItem && matchesCategory && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
      default:
        return new Date(b.timePosted).getTime() - new Date(a.timePosted).getTime();
      case 'oldest':
        return new Date(a.timePosted).getTime() - new Date(b.timePosted).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
    }
  });

  // Calculate category counts (excluding user's own items)
  const categoryCountsMap = items.reduce((acc, item) => {
    const isAvailable = item.status === 'available';
    const isNotOwnItem = !currentUser || item.ownerId !== currentUser.email;
    
    if (isAvailable && isNotOwnItem) {
      acc[item.category] = (acc[item.category] || 0) + 1;
      acc['all'] = (acc['all'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar - Categories */}
      <div className="hidden lg:block w-64 border-r bg-muted/30 p-6">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          itemCounts={categoryCountsMap}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2>
              {selectedCategory === 'all' ? 'All Items' : 
               selectedCategory === 'books' ? 'Books & Textbooks' :
               selectedCategory === 'clothing' ? 'Clothing' :
               selectedCategory === 'electronics' ? 'Electronics' :
               selectedCategory === 'furniture' ? 'Furniture' :
               selectedCategory === 'gaming' ? 'Gaming' : 'Other Items'}
            </h2>
            <p className="text-muted-foreground">
              {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'} available
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Refresh
              </Button>
            )}
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Category Filter */}
        <div className="lg:hidden mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items ({categoryCountsMap.all || 0})</SelectItem>
              <SelectItem value="books">Books & Textbooks ({categoryCountsMap.books || 0})</SelectItem>
              <SelectItem value="clothing">Clothing ({categoryCountsMap.clothing || 0})</SelectItem>
              <SelectItem value="electronics">Electronics ({categoryCountsMap.electronics || 0})</SelectItem>
              <SelectItem value="furniture">Furniture ({categoryCountsMap.furniture || 0})</SelectItem>
              <SelectItem value="gaming">Gaming ({categoryCountsMap.gaming || 0})</SelectItem>
              <SelectItem value="other">Other ({categoryCountsMap.other || 0})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items Grid/List */}
        {sortedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? `No items found matching "${searchQuery}"` : 'No items found in this category'}
            </p>
            <Button variant="outline" onClick={() => setSelectedCategory('all')}>
              View All Items
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}