import { Book, Shirt, Smartphone, Home, Gamepad2, Users, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const categories = [
  { id: 'all', name: 'All Items', icon: Filter, count: 0 },
  { id: 'books', name: 'Books & Textbooks', icon: Book, count: 0 },
  { id: 'clothing', name: 'Clothing', icon: Shirt, count: 0 },
  { id: 'electronics', name: 'Electronics', icon: Smartphone, count: 0 },
  { id: 'furniture', name: 'Furniture', icon: Home, count: 0 },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, count: 0 },
  { id: 'other', name: 'Other', icon: Users, count: 0 },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  itemCounts?: Record<string, number>;
}

export function CategoryFilter({ selectedCategory, onCategoryChange, itemCounts = {} }: CategoryFilterProps) {
  return (
    <div className="w-full">
      <h3 className="mb-4">Categories</h3>
      <div className="space-y-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const count = itemCounts[category.id] || 0;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "ghost"}
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => onCategoryChange(category.id)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{category.name}</span>
              {count > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}