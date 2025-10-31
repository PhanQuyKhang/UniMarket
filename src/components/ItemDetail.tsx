import { ArrowLeft, Heart, Share2, MapPin, Clock, Star, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Item } from "./ItemCard";
import { ExchangeRequest } from "../data/userDataService";
import { useState, useRef } from "react";

interface ItemDetailProps {
  item: Item;
  onBack: () => void;
  onExchange?: (itemId: string) => void;
  isOwner?: boolean;
  exchangeRequests?: ExchangeRequest[];
  onAcceptExchange?: (requestId: string) => void;
  onRejectExchange?: (requestId: string) => void;
  userItems?: Item[];
  onSubmitExchange?: (targetItemId: string, selectedItemIds: string[]) => void;
  showExchangeInterface?: boolean;
  allItems?: Item[];
  onViewItem?: (itemId: string) => void;
}

export function ItemDetail({ item, onBack, onExchange, isOwner, exchangeRequests, onAcceptExchange, onRejectExchange, userItems = [], onSubmitExchange, showExchangeInterface = false, allItems = [], onViewItem }: ItemDetailProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [showExchange, setShowExchange] = useState(showExchangeInterface);
  const exchangeSectionRef = useRef<HTMLDivElement>(null);
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg">
            <ImageWithFallback
              src={item.images[0]}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          {item.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.images.slice(1, 5).map((image, index) => (
                <div key={index} className="aspect-square overflow-hidden rounded border">
                  <ImageWithFallback
                    src={image}
                    alt={`${item.title} ${index + 2}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-semibold">{item.title}</h1>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Posted {item.timePosted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{item.category}</Badge>
              <Badge variant="outline">{item.condition}</Badge>
            </div>

            <div className="mb-6">
              <Badge variant={item.status === 'available' ? 'default' : item.status === 'exchanging' ? 'secondary' : 'outline'} className="text-sm">
                {item.status === 'available' ? 'Available for Exchange' : 
                 item.status === 'exchanging' ? 'Exchange in Progress' : 'Already Exchanged'}
              </Badge>
            </div>
          </div>

          {/* Seller Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={item.seller.avatar} alt={item.seller.name} />
                    <AvatarFallback>{item.seller.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{item.seller.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">
                        {item.seller.rating.toFixed(1)} rating
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {isOwner ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">This is your item</p>
                  {exchangeRequests && exchangeRequests.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Exchange Requests ({exchangeRequests.length}):</p>
                      {exchangeRequests.filter(req => req.status === 'pending').map((request) => {
                        const offeredItems = request.offeredItemIds.map(id => 
                          allItems.find(item => item.id === id)
                        ).filter((item): item is Item => item !== undefined);
                        
                        return (
                          <div key={request.id} className="p-3 border rounded-lg bg-yellow-50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">{request.requesterName}</p>
                              <Badge variant="outline" className="text-xs">Pending</Badge>
                            </div>
                            
                            {/* Offered Items */}
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-2">
                                Offering {request.offeredItemIds.length} item(s) for exchange:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {offeredItems.map((offeredItem) => (
                                  <button
                                    key={offeredItem.id}
                                    onClick={() => onViewItem?.(offeredItem.id)}
                                    className="flex items-center gap-2 p-2 border rounded-lg bg-white hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer"
                                    title="Click to view item details"
                                  >
                                    <img 
                                      src={offeredItem.images[0]} 
                                      alt={offeredItem.title}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                    <div className="text-left">
                                      <p className="text-xs font-medium text-gray-800 truncate max-w-32">
                                        {offeredItem.title}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {offeredItem.condition}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => onAcceptExchange?.(request.id)} className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600">
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => onRejectExchange?.(request.id)} className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600">
                                Reject
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {exchangeRequests.filter(req => req.status !== 'pending').length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          View all requests in the Exchanges page
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => {
                      console.log('Exchange button clicked for item:', item.id, 'Status:', item.status);
                      const newShowExchange = !showExchange;
                      setShowExchange(newShowExchange);
                      
                      // Scroll to exchange section when opening
                      if (newShowExchange) {
                        setTimeout(() => {
                          exchangeSectionRef.current?.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                        }, 100);
                      }
                    }}
                    disabled={item.status !== 'available'}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {item.status !== 'available' ? `Cannot Exchange (${item.status})` : 
                     showExchange ? 'Hide Exchange Options' : 'Request Exchange'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="mb-3">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Safety Tips */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Safety Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Meet in a public place on campus</li>
                <li>• Inspect the item before purchasing</li>
                <li>• Use secure payment methods</li>
                <li>• Trust your instincts</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exchange Interface */}
      {showExchange && !isOwner && item.status === 'available' && (
        <div ref={exchangeSectionRef} className="mt-8 p-6 bg-gray-50 rounded-lg border max-w-6xl mx-auto">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Exchange Options
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Target Item (What you want) */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                👤 Item You Want
              </h4>
              <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
                <img 
                  src={item.images[0]} 
                  alt={item.title}
                  className="w-full h-32 object-cover rounded mb-3"
                />
                <h5 className="font-medium">{item.title}</h5>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="text-xs text-gray-500">
                  <p>Owner: {item.seller.name}</p>
                  <p>Condition: {item.condition}</p>
                </div>
              </div>
            </div>

            {/* Your Items */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                🎒 Your Items to Offer
              </h4>
              {userItems.filter(userItem => userItem.status === 'available').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You don't have any available items to exchange.</p>
                  <p>Add some items first!</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-3">Select one item to offer:</p>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {userItems.filter(userItem => userItem.status === 'available').map((userItem) => (
                      <div 
                        key={userItem.id} 
                        className={`cursor-pointer border-2 rounded-lg p-3 transition-all hover:shadow-md ${
                          selectedItemId === userItem.id 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedItemId(userItem.id === selectedItemId ? "" : userItem.id)}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={userItem.images[0]} 
                            alt={userItem.title}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{userItem.title}</h5>
                            <p className="text-xs text-gray-600">{userItem.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Condition: {userItem.condition}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedItemId === userItem.id 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-400'
                          }`}>
                            {selectedItemId === userItem.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exchange Preview */}
          {selectedItemId && (
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">You give:</p>
                  <p className="text-lg font-bold text-red-600">
                    {userItems.find(userItem => userItem.id === selectedItemId)?.title}
                  </p>
                </div>
                <div className="text-2xl">⇄</div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">You get:</p>
                  <p className="text-lg font-bold text-green-600">{item.title}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Message and Action Buttons - Only show when item is selected */}
          {selectedItemId && (
            <>
              <div className="mt-4 text-center">
                <div className="inline-block text-sm text-gray-700 bg-yellow-100 px-4 py-2 rounded-lg border border-yellow-200">
                  ✅ Item selected! Ready to send exchange request.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between gap-4">
                <button 
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                  onClick={() => setShowExchange(false)}
                >
                  ❌ Cancel
                </button>
                
                <button 
                  className="px-6 py-3 border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 rounded-lg font-semibold transition-all"
                  onClick={() => {
                    if (selectedItemId && onSubmitExchange) {
                      console.log('Calling onSubmitExchange with:', item.id, [selectedItemId]);
                      onSubmitExchange(item.id, [selectedItemId]);
                      setSelectedItemId("");
                      setShowExchange(false);
                    } else {
                      console.log('Cannot submit exchange - missing selectedItemId or onSubmitExchange');
                      alert('Please select an item to exchange');
                    }
                  }}
                >
                  ✅ SEND REQUEST
                </button>
              </div>
            </>
          )}
        </div>
      )}


    </div>
  );
}