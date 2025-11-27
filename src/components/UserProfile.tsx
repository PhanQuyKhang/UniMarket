import { useState } from "react";
import { Edit3, Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ItemCard, Item } from "./ItemCard";
import NotificationItem, { Notification } from "./NotificationItem";
import { ExchangeRequest } from "../data/userDataService";

interface UserProfileProps {
  userItems: Item[];
  exchangeRequests?: ExchangeRequest[];
  onCompleteExchange?: (requestId: string) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  } | null;
  onItemClick: (item: Item) => void;
  onSellNewItem: () => void;
  onEditItem: (item: Item) => void;
  onEditProfile: (profileData: any) => void;
  onAcceptExchange?: (requestId: string) => void;
  onRejectExchange?: (requestId: string) => void;
  onViewItem?: (itemId?: string) => void;
}

export function UserProfile({ userItems, user, onItemClick, onSellNewItem, onEditItem, onEditProfile, exchangeRequests = [], onAcceptExchange, onRejectExchange, onViewItem, onCompleteExchange }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState('selling');
  const [showEditModal, setShowEditModal] = useState(false);

  const stats = {
    totalListings: userItems.length,
    averageRating: 4.8,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 w-full">
      {/* Profile Header */}
      <Card className="mb-8 w-full">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="w-20 h-20">
              {user && user.avatar ? (
                <AvatarImage src={user.avatar} />
              ) : (
                <AvatarFallback>{user && user.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'YU'}</AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{user?.name || 'Your Profile'}</h1>
                  <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>

                  {/* Contact Details */}
                  {(user?.phone || user?.facebook || user?.instagram || user?.twitter || user?.linkedin) && (
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Details</h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {user?.phone && (
                          <div className="flex items-center gap-1">
                            <span>📱</span>
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user?.facebook && (
                          <div className="flex items-center gap-1">
                            <span>📘</span>
                            <a href={user.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook</a>
                          </div>
                        )}
                        {user?.instagram && (
                          <div className="flex items-center gap-1">
                            <span>📷</span>
                            <a href={user.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">Instagram</a>
                          </div>
                        )}
                        {user?.twitter && (
                          <div className="flex items-center gap-1">
                            <span>🐦</span>
                            <a href={user.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Twitter</a>
                          </div>
                        )}
                        {user?.linkedin && (
                          <div className="flex items-center gap-1">
                            <span>💼</span>
                            <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">LinkedIn</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-3">
                    <span className="text-sm">⭐ {stats.averageRating}</span>
                    <span className="text-xs text-muted-foreground">(Based on {Math.floor(Math.random() * 20) + 5} reviews)</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button onClick={onSellNewItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold text-primary">{stats.totalListings}</div>
            <p className="text-sm text-muted-foreground">Active Listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-full">
          <TabsTrigger value="selling">My Listings ({userItems.length})</TabsTrigger>
          <TabsTrigger value="notifications">Notifications ({exchangeRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="selling" className="mt-6 w-full">
          {userItems.length === 0 ? (
            <Card className="w-full">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't listed any items yet.</p>
                  <p>Start selling items you no longer need!</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={onSellNewItem}>
                    List Your First Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
              {userItems.map((item) => (
                <div key={item.id} className="relative">
                  <ItemCard
                    item={item}
                    onItemClick={onItemClick}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-12 bg-white/80 hover:bg-white"
                    disabled={item.status === 'exchanged'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditItem(item);
                    }}
                    title={item.status === 'exchanged' ? 'Cannot edit exchanged items' : 'Edit item'}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 w-full">
          {exchangeRequests.length === 0 ? (
            <Card className="w-full">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <p>No notifications yet.</p>
                  <p>Check back for exchange requests and system messages.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {exchangeRequests.map(req => {
                // Map to notification UI
                const notif: Notification = {
                  id: req.id,
                  type: "exchange",
                  title: `${req.requesterName} requested an exchange`,
                  body: `Offering ${req.offeredItemIds.length} item(s) for your item.`,
                  createdAt: req.createdAt,
                  read: false,
                  status: req.status,
                  from: { name: req.requesterName },
                  relatedItemId: req.targetItemId
                };

                return (
                  <NotificationItem
                    key={req.id}
                    notification={notif}
                    onAccept={onAcceptExchange}
                    onReject={onRejectExchange}
                    onOpenItem={(itemId) => onViewItem?.(itemId)}
                    onComplete={onCompleteExchange}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      {showEditModal && <EditProfileModal />}
    </div>
  );

  function EditProfileModal() {
    const [formData, setFormData] = useState({
      name: user?.name || '',
      phone: user?.phone || '',
      facebook: user?.facebook || '',
      instagram: user?.instagram || '',
      twitter: user?.twitter || '',
      linkedin: user?.linkedin || '',
    });

    const handleInputChange = (field: string, value: string) => {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: any) => {
      e.preventDefault();
      onEditProfile(formData);
      setShowEditModal(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Edit Profile</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditModal(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e: any) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Details</h3>
              <p className="text-sm text-muted-foreground">These details are optional and will be visible to other users</p>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e: any) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., +1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="facebook">Facebook Profile</Label>
                <Input
                  id="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={(e: any) => handleInputChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourprofile"
                />
              </div>

              <div>
                <Label htmlFor="instagram">Instagram Profile</Label>
                <Input
                  id="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={(e: any) => handleInputChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>

              <div>
                <Label htmlFor="twitter">Twitter Profile</Label>
                <Input
                  id="twitter"
                  type="url"
                  value={formData.twitter}
                  onChange={(e: any) => handleInputChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div>
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={(e: any) => handleInputChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}