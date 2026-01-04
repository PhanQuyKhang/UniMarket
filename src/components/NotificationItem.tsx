import React from "react";
import { Check, X, Bell, Clock, Eye } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export type NotificationType = "exchange" | "message" | "system";

export interface Notification {
  id: string;
  type?: NotificationType;
  title: string;
  body?: string;
  createdAt?: string; // ISO string
  read?: boolean;
  status?: "pending" | "accepted" | "rejected" | "info";
  from?: {
    name?: string;
    avatar?: string;
    email?: string;
  };
  relatedItemId?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onOpenItem?: (itemId: string | undefined) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onOpenItem,
}: NotificationItemProps) {
  const timeLabel = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString()
    : "";

  const statusBadge = (() => {
    if (notification.status === "pending") return <Badge variant="secondary">Pending</Badge>;
    if (notification.status === "accepted") return <Badge variant="default">Accepted</Badge>;
    if (notification.status === "rejected") return <Badge variant="outline">Rejected</Badge>;
    return <Badge variant="ghost">Info</Badge>;
  })();

  return (
    <Card className={`w-full ${notification.read ? "opacity-60" : ""}`}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex-shrink-0">
          <Avatar>
            {notification.from?.avatar ? (
              <AvatarImage src={notification.from.avatar} alt={notification.from.name} />
            ) : (
              <AvatarFallback>{(notification.from?.name || "S").slice(0, 1).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
                {statusBadge}
              </div>
              {notification.body && (
                <p className="text-sm text-muted-foreground truncate mt-1">{notification.body}</p>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <div className="text-xs text-muted-foreground">{timeLabel}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {/* Open related item */}
            {notification.relatedItemId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenItem?.(notification.relatedItemId)}
                className="gap-2"
                aria-label="Open related item"
              >
                <Eye className="h-4 w-4" />
                View Item
              </Button>
            )}

            {/* Action buttons removed as notifications should only display information */}

            {/* Mark read / unread */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkRead?.(notification.id)}
              className="ml-auto gap-2"
              aria-label="Toggle read"
            >
              <Bell className="h-4 w-4" />
              {notification.read ? "Mark Unread" : "Mark Read"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationItem;
