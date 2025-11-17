import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Flag, 
  User, 
  Ban, 
  CheckCircle, 
  XCircle,
  Search,
  AlertTriangle,
  ShieldAlert
} from "lucide-react";
import { Item } from "./ItemCard";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { UserDataService, UserData, Report } from "../data/userDataService";

export interface Report {
  id: string;
  itemId: string;
  itemTitle: string;
  reporterName: string;
  reporterAvatar: string;
  reason: string;
  description: string;
  date: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface UserAccount {
  id: string;
  name: string;
  avatar: string;
  email: string;
  joinDate: string;
  rating: number;
  itemsListed: number;
  itemsSold: number;
  status: 'active' | 'warned' | 'suspended' | 'banned';
  reports: number;
}

interface AdminDashboardProps {
  items: Item[];
  reports: Report[];
  users: UserAccount[];
  onCensorItem: (itemId: string, censored: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateReportStatus: (reportId: string, status: Report['status'], note?: string) => void;
  onUpdateUserStatus: (userId: string, status: UserAccount['status'], reason?: string) => void;
  onItemClick: (item: Item) => void;
}

export function AdminPage({
  items,
  reports,
  users,
  onCensorItem,
  onDeleteItem,
  onUpdateReportStatus,
  onUpdateUserStatus,
  onItemClick,
}: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'censor' | 'delete' | 'report' | 'user' | null;
    data?: any;
  }>({ type: null });
  const [actionNote, setActionNote] = useState('');
  const [newUserStatus, setNewUserStatus] = useState<UserAccount['status']>('active');

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const censoredItemsCount = items.filter(i => (i as any).censored).length;
  const suspendedUsersCount = users.filter(u => u.status === 'suspended' || u.status === 'banned').length;

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCensorAction = (item: Item, censor: boolean) => {
    setActionDialog({ type: 'censor', data: { item, censor } });
  };

  const handleDeleteAction = (item: Item) => {
    setActionDialog({ type: 'delete', data: item });
  };

  const handleReportAction = (report: Report, status: Report['status']) => {
    setActionDialog({ type: 'report', data: { report, status } });
    setSelectedReport(report);
  };

  const handleUserAction = (user: UserAccount, status: UserAccount['status']) => {
    setActionDialog({ type: 'user', data: { user, status } });
    setSelectedUser(user);
    setNewUserStatus(status);
  };

  const confirmAction = () => {
    if (actionDialog.type === 'censor' && actionDialog.data) {
      onCensorItem(actionDialog.data.item.id, actionDialog.data.censor);
    } else if (actionDialog.type === 'delete' && actionDialog.data) {
      onDeleteItem(actionDialog.data.id);
    } else if (actionDialog.type === 'report' && actionDialog.data) {
      onUpdateReportStatus(actionDialog.data.report.id, actionDialog.data.status, actionNote);
    } else if (actionDialog.type === 'user' && actionDialog.data) {
      onUpdateUserStatus(actionDialog.data.user.id, actionDialog.data.status, actionNote);
    }
    
    setActionDialog({ type: null });
    setActionNote('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'reviewed': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'dismissed': return 'bg-gray-500';
      case 'active': return 'bg-green-500';
      case 'warned': return 'bg-yellow-500';
      case 'suspended': return 'bg-orange-500';
      case 'banned': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage items, handle reports, and moderate users
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flag className="h-4 w-4 text-yellow-500" />
              Pending Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{pendingReportsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-red-500" />
              Censored Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{censoredItemsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ban className="h-4 w-4 text-orange-500" />
              Suspended Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{suspendedUsersCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Censor Items</TabsTrigger>
          <TabsTrigger value="reports">
            Handle Reports
            {pendingReportsCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingReportsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Manage Users</TabsTrigger>
        </TabsList>

        {/* Censor Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Item Management</CardTitle>
              <CardDescription>
                Review and moderate marketplace items
              </CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="truncate">{item.title}</h3>
                        {(item as any).censored && (
                          <Badge variant="destructive" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            Censored
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {/* Owner and posted time */}
                        {item.ownerId} • {item.timePosted}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onItemClick(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(item as any).censored ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCensorAction(item, false)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Uncensor
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCensorAction(item, true)}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Censor
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAction(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Handle Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>
                Review and respond to user-submitted reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <img
                          src={report.reporterAvatar}
                          alt={report.reporterName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{report.reporterName}</span>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Reported: <span className="font-medium">{report.itemTitle}</span>
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">Reason:</span> {report.reason}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {report.description}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {report.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {report.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReportAction(report, 'reviewed')}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleReportAction(report, 'resolved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReportAction(report, 'dismissed')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3>{user.name}</h3>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                        {user.reports > 0 && (
                          <Badge variant="destructive">
                            {user.reports} reports
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {user.joinDate} • Rating: {user.rating} • {user.itemsListed} items listed • {user.itemsSold} sold
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {user.status !== 'warned' && user.status !== 'suspended' && user.status !== 'banned' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserAction(user, 'warned')}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Warn
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUserAction(user, 'suspended')}
                          >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUserAction(user, 'banned')}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban
                          </Button>
                        </>
                      )}
                      {(user.status === 'warned' || user.status === 'suspended' || user.status === 'banned') && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUserAction(user, 'active')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={actionDialog.type !== null} onOpenChange={() => setActionDialog({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'censor' && 'Confirm Item Censorship'}
              {actionDialog.type === 'delete' && 'Confirm Item Deletion'}
              {actionDialog.type === 'report' && 'Update Report Status'}
              {actionDialog.type === 'user' && 'Update User Status'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'censor' && actionDialog.data?.censor &&
                `Are you sure you want to censor "${actionDialog.data?.item?.title}"? This item will be hidden from public view.`
              }
              {actionDialog.type === 'censor' && !actionDialog.data?.censor &&
                `Are you sure you want to uncensor "${actionDialog.data?.item?.title}"? This item will be visible to users again.`
              }
              {actionDialog.type === 'delete' &&
                `Are you sure you want to permanently delete "${actionDialog.data?.title}"? This action cannot be undone.`
              }
              {actionDialog.type === 'report' &&
                `Update the status of this report to "${actionDialog.data?.status}". Add notes for your records.`
              }
              {actionDialog.type === 'user' &&
                `Change user status to "${actionDialog.data?.status}". Please provide a reason for this action.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {(actionDialog.type === 'report' || actionDialog.type === 'user') && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="action-note">
                  {actionDialog.type === 'report' ? 'Admin Notes' : 'Reason'}
                </Label>
                <Textarea
                  id="action-note"
                  placeholder={actionDialog.type === 'report' 
                    ? "Add notes about this report..." 
                    : "Explain why this action is being taken..."}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null })}>
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === 'delete' || (actionDialog.type === 'user' && actionDialog.data?.status === 'banned') ? 'destructive' : 'default'}
              onClick={confirmAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
