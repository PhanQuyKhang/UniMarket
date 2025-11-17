import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Star } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { ItemCard, Item } from "./ItemCard";

interface UserProfileViewProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    rating: number;
  };
  userItems: Item[];
  onBack: () => void;
  onItemClick: (item: Item) => void;
}

export function UserProfileView({ user, userItems, onBack, onItemClick }: UserProfileViewProps) {
  const availableItems = userItems.filter(item => item.status === 'available');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="mb-8 w-full">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
              
              <div className="flex items-center gap-2 mt-3">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{user.rating.toFixed(1)} rating</span>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary">{availableItems.length} items available</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Items Available for Exchange</h2>
        
        {availableItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">This user has no items available for exchange.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {availableItems.map((item) => (
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
