import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { CheckCircle, XCircle, Clock, ArrowLeftRight } from "lucide-react";
import { ItemCard, Item } from "./ItemCard";
import { ExchangeRequest } from "../data/userDataService";

interface ExchangeRequestsPageProps {
  exchangeRequests: ExchangeRequest[];
  allItems: Item[];
  currentUserEmail: string;
  onAcceptExchange: (requestId: string) => void;
  onRejectExchange: (requestId: string) => void;
  onBack: () => void;
  onItemClick: (item: Item) => void;
  onCompleteExchange?: (requestId: string) => void;
  onCancelExchange?: (requestId: string) => void;
}

export function ExchangeRequestsPage({ 
  exchangeRequests, 
  allItems, 
  currentUserEmail, 
  onAcceptExchange, 
  onRejectExchange, 
  onBack,
  onItemClick,
  onCompleteExchange,
  onCancelExchange
}: ExchangeRequestsPageProps) {
  const [filter, setFilter] = useState<'incoming' | 'outgoing' | 'exchanging' | 'completed'>('incoming');

  // Separate incoming / outgoing and special-state requests
  const incomingRequests = exchangeRequests.filter(req => req.targetOwnerId === currentUserEmail && req.status === 'pending');
  const outgoingRequests = exchangeRequests.filter(req => req.requesterId === currentUserEmail && req.status === 'pending');
  // Exchanging = accepted (both sides are now in the "in-progress" exchange phase)
  const exchangingRequests = exchangeRequests.filter(req => req.status === 'accepted' && (req.requesterId === currentUserEmail || req.targetOwnerId === currentUserEmail));
  const completedRequests = exchangeRequests.filter(req => req.status === 'completed' && (req.requesterId === currentUserEmail || req.targetOwnerId === currentUserEmail));

  const getFilteredRequests = () => {
    switch (filter) {
      case 'incoming':
        return incomingRequests;
      case 'outgoing':
        return outgoingRequests;
      case 'exchanging':
        return exchangingRequests;
      case 'completed':
        return completedRequests;
      default:
        return [];
    }
  };

  const getItemById = (itemId: string): Item | undefined => {
    return allItems.find(item => item.id === itemId);
  };

  const getStatusColor = (status: ExchangeRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-200 text-green-900';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
 
  const getStatusIcon = (status: ExchangeRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Exchange Requests</h1>
            <p className="text-muted-foreground">
              Manage your exchange requests and offers
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 w-full">
        <Button
          variant={filter === 'incoming' ? 'default' : 'outline'}
          onClick={() => setFilter('incoming')}
          className="gap-2"
        >
          📥 Incoming ({incomingRequests.length})
        </Button>
        <Button
          variant={filter === 'outgoing' ? 'default' : 'outline'}
          onClick={() => setFilter('outgoing')}
          className="gap-2"
        >
          📤 Outgoing ({outgoingRequests.length})
        </Button>
        <Button
          variant={filter === 'exchanging' ? 'default' : 'outline'}
          onClick={() => setFilter('exchanging')}
          className="gap-2"
        >
          🔁 Exchanging ({exchangingRequests.length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          className="gap-2"
        >
          ✅ Completed ({completedRequests.length})
        </Button>
      </div>

      {/* Exchange Requests */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exchange Requests</h3>
            <p className="text-muted-foreground">
              {filter === 'incoming' 
                ? "You haven't received any exchange requests yet."
                : filter === 'outgoing'
                ? "You haven't sent any exchange requests yet."
                : filter === 'exchanging'
                ? "No ongoing exchanges."
                : "No completed exchanges found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((request) => {
            const targetItem = getItemById(request.targetItemId);
            const offeredItems = request.offeredItemIds.map(id => getItemById(id)).filter(Boolean) as Item[];
            const isIncoming = request.targetOwnerId === currentUserEmail;

            return (
              <Card key={request.id} className="overflow-hidden w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {isIncoming ? 'Incoming' : 'Outgoing'} Exchange Request
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {isIncoming ? `From ${request.requesterName}` : `To ${targetItem?.seller.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Created: {new Date(request.createdAt).toLocaleDateString()}</p>
                      {request.updatedAt !== request.createdAt && (
                        <p>Updated: {new Date(request.updatedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="w-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {/* Target Item */}
                    <div className="w-full min-w-0">
                      <h4 className="font-semibold mb-3 text-center">
                        {isIncoming ? 'Your Item' : 'Requested Item'}
                      </h4>
                      {targetItem && (
                        <div className="border rounded-lg p-3 w-full">
                          <ItemCard
                            item={targetItem}
                            onItemClick={onItemClick}
                          />
                        </div>
                      )}
                    </div>

                    {/* Offered Items */}
                    <div className="w-full min-w-0">
                      <h4 className="font-semibold mb-3 text-center">
                        {isIncoming ? 'Offered Items' : 'Your Offered Items'}
                      </h4>
                      <div className="space-y-3 w-full">
                        {offeredItems.map((item) => (
                          <div key={item.id} className="border rounded-lg p-3 w-full">
                            <ItemCard
                              item={item}
                              onItemClick={onItemClick}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isIncoming && request.status === 'pending' && (
                    <div className="flex gap-3 mt-6 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => onRejectExchange(request.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Exchange
                      </Button>
                      <Button
                        onClick={() => onAcceptExchange(request.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept Exchange
                      </Button>
                    </div>
                  )}

                  {/* If outgoing and pending, show cancel */}
                  {!isIncoming && request.status === 'pending' && (
                    <div className="flex gap-3 mt-6 justify-center">
                      <Button variant="outline" onClick={() => onCancelExchange?.(request.id)}>
                        Cancel Request
                      </Button>
                    </div>
                  )}

                  {/* If accepted, allow marking completed (both sides may trigger completion) */}
                  {request.status === 'accepted' && (
                    <div className="flex gap-3 mt-6 justify-center items-center">
                      {/* If current user already confirmed, show waiting message but still allow cancel */}
                      { (isIncoming ? request.ownerConfirmed : request.requesterConfirmed) ? (
                        <>
                          <div className="text-sm text-muted-foreground">Waiting for the other party to confirm...</div>
                          <Button variant="outline" onClick={() => onCancelExchange?.(request.id)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="default" onClick={() => onCompleteExchange?.(request.id)}>
                            Mark as Completed
                          </Button>
                          <Button variant="outline" onClick={() => onCancelExchange?.(request.id)}>
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Completed or cancelled notifications */}
                  {request.status === 'completed' && (
                    <div className="text-center mt-6">
                      <Badge className={`${getStatusColor(request.status)} px-4 py-2`}>
                        ✅ Exchange Completed
                      </Badge>
                    </div>
                  )}
                  {request.status === 'cancelled' && (
                    <div className="text-center mt-6">
                      <Badge className={`${getStatusColor(request.status)} px-4 py-2`}>
                        ❌ Exchange Cancelled
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}