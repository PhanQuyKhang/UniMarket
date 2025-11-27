import { MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export interface Item {
  id: string;
  title: string;
  location: string;
  timePosted: string;
  category: string;
  condition: string;
  images: string[];
  description: string;
  seller: {
    name: string;
    avatar: string;
    rating: number;
  };
  status: 'available' | 'pending_offer' | 'exchanging' | 'exchanged';
  ownerId?: string; // ID of the user who owns this item
}

interface ItemCardProps {
  item: Item;
  onItemClick: (item: Item) => void;
}

export function ItemCard({ item, onItemClick }: ItemCardProps) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
      onClick={() => onItemClick(item)}
    >
      <div className="relative aspect-square overflow-hidden">
        <ImageWithFallback
          src={item.images[0]}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-white/80"
        >
          {item.condition}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
            {item.status !== 'available' && (
              <Badge variant={item.status === 'exchanging' ? 'secondary' : item.status === 'pending_offer' ? 'outline' : 'default'} className="text-xs">
                {item.status === 'exchanging' ? 'Exchanging' : item.status === 'pending_offer' ? 'Pending Offer' : 'Exchanged'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{item.timePosted}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <ImageWithFallback
              src={item.seller.avatar}
              alt={item.seller.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs text-muted-foreground">
              {item.seller.name}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}