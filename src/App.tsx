import React, { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { Header } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { ItemDetail } from "./components/ItemDetail";
import { AddItemForm } from "./components/SellItemForm";
import { UserProfile } from "./components/UserProfile";
import { UserProfileView } from "./components/UserProfileView";
import { LoginPage } from "./components/LoginPage";
import { ExchangeModal } from "./components/ExchangeModal";
import { ExchangeRequestsPage } from "./components/ExchangeRequestsPage";
import { Item } from "./components/ItemCard";
import { ExchangeRequest } from "./data/userDataService";
import { api } from "./services/api";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { AdminPage } from "./components/AdminPage";

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [navigationHistory, setNavigationHistory] = useState<Array<{
    page: string
    item?: Item | null
    userId?: string | null
    itemStack?: Item[]
  }>>([
    { page: 'home' }
  ]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemNavigationStack, setItemNavigationStack] = useState<Item[]>([]);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    avatar: string;
  } | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedExchangeItem, setSelectedExchangeItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Load initial data
  useEffect(() => {
    refreshItemsFromDatabase();
  }, []);

  const navigateToPage = (newPage: string, context?: { item?: Item | null; userId?: string | null; itemStack?: Item[] }, push = true) => {
    const snapshot = {
      page: newPage,
      item: context?.item ?? (newPage === 'item-detail' ? selectedItem : null),
      userId: context?.userId ?? (newPage === 'user-profile' ? viewedUserId : null),
      itemStack: context?.itemStack ?? itemNavigationStack
    };

    if (push) {
      setNavigationHistory(prev => [...prev, snapshot]);
    } else {
      setNavigationHistory(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = snapshot;
        return copy;
      });
    }

    setCurrentPage(newPage);
  };

  const handleItemDetailBack = () => {
    if (itemNavigationStack.length > 0) {
      const previousItem = itemNavigationStack[itemNavigationStack.length - 1];
      const newStack = itemNavigationStack.slice(0, -1);
      setItemNavigationStack(newStack);
      setSelectedItem(previousItem);
    } else {
      handleGoBack();
    }
  };

  const handleGoBack = () => {
    if (navigationHistory.length <= 1) {
      setCurrentPage('home');
      setSelectedItem(null);
      setViewedUserId(null);
      setItemNavigationStack([]);
      return;
    }

    if (currentPage === 'user-profile') {
      const entries = navigationHistory.slice(0, -1);
      let idx = -1;
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].page === 'item-detail') {
          idx = i;
          break;
        }
      }

      if (idx >= 0) {
        const newHistory = entries.slice(0, idx + 1);
        const entry = entries[idx];
        setNavigationHistory(newHistory);
        setCurrentPage(entry.page);
        setSelectedItem(entry.item || null);
        setViewedUserId(entry.userId || null);
        setItemNavigationStack(entry.itemStack || []);
        return;
      }
    }

    const newHistory = navigationHistory.slice(0, -1);
    const previousEntry = newHistory[newHistory.length - 1];

    setNavigationHistory(newHistory);
    setCurrentPage(previousEntry.page);
    setSelectedItem(previousEntry.item || null);
    setViewedUserId(previousEntry.userId || null);
    setItemNavigationStack(previousEntry.itemStack || []);
  };

  const refreshItemsFromDatabase = async () => {
    try {
      const allItems = await api.getItems();
      console.log('App.tsx: Fetched items:', allItems.length, allItems.length > 0 ? allItems[0] : 'No items');
      setItems(allItems);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to load items');
    }
  };

  // Auto-refresh data
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      refreshAllUserData();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  const refreshAllUserData = async () => {
    await refreshItemsFromDatabase();
    if (user) {
      try {
        const [myItems, requests] = await Promise.all([
          api.getUserItems(user.id),
          api.getExchangeRequests(user.id)
        ]);
        // Only log if data changes or for debugging (optional, can be removed to reduce noise)
        // console.log('App.tsx: Fetched user data');
        setUserItems(myItems);
        setExchangeRequests(requests);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    }
  };

  const handleNavigate = (page: string) => {
    setNavigationHistory([{ page: 'home' }, { page, item: null, userId: null, itemStack: [] }]);
    setCurrentPage(page);
    setSelectedItem(null);
    setViewedUserId(null);
    setItemNavigationStack([]);

    if (page === 'home') {
      refreshItemsFromDatabase();
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      let userData;

      if (credentialResponse.credential) {
        const decoded = jwtDecode(credentialResponse.credential) as any;
        userData = {
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture
        };
      } else if (credentialResponse.name) {
        // Handle implicit flow response structure
        userData = credentialResponse;
      }

      if (userData) {
        const backendUser = await api.login(userData);

        setUser({
          id: String(backendUser.id),
          name: backendUser.name,
          email: backendUser.email,
          avatar: backendUser.picture,
        });

        setIsLoggedIn(true);

        // Fetch user items and requests
        const [myItems, requests] = await Promise.all([
          api.getUserItems(backendUser.id),
          api.getExchangeRequests(backendUser.id)
        ]);
        setUserItems(myItems);
        setExchangeRequests(requests);

        setCurrentPage('profile');
        toast.success(`Successfully logged in as ${backendUser.name}`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed');
    }
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      setCurrentPage('profile');
    } else {
      setCurrentPage('login');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setUserItems([]);
    setExchangeRequests([]);
    setCurrentPage('home');
    toast.success('Successfully logged out!');
  };

  const handleEditProfile = (profileData: any) => {
    toast.info('Profile update not implemented yet');
  };

  const handleTestLogin = async () => {
    const testUser = {
      name: 'Test User',
      email: 'test@university.edu',
      picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=60'
    };

    try {
      const backendUser = await api.login(testUser);
      setUser({
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        avatar: backendUser.picture,
      });
      setIsLoggedIn(true);
      const [myItems, requests] = await Promise.all([
        api.getUserItems(backendUser.id),
        api.getExchangeRequests(backendUser.id)
      ]);
      setUserItems(myItems);
      setExchangeRequests(requests);
      setCurrentPage('profile');
      toast.success('Test login successful!');
    } catch (error) {
      console.error(error);
      toast.error('Test login failed');
    }
  };

  const handleAdminLogin = async () => {
    // For demo purposes, we'll just log in as a predefined admin user
    // In a real app, this would verify admin credentials
    const adminUser = {
      name: 'Admin User',
      email: 'admin@unimarket.edu',
      picture: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
    };

    try {
      const backendUser = await api.login(adminUser);
      setUser({
        id: String(backendUser.id),
        name: backendUser.name,
        email: backendUser.email,
        avatar: backendUser.picture,
      });
      setIsLoggedIn(true);

      // Fetch data
      const [myItems, requests] = await Promise.all([
        api.getUserItems(backendUser.id),
        api.getExchangeRequests(backendUser.id)
      ]);
      setUserItems(myItems);
      setExchangeRequests(requests);

      setCurrentPage('admin');
      toast.success('Logged in as Admin');
    } catch (error) {
      console.error('Admin login failed:', error);
      toast.error('Admin login failed');
    }
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setItemNavigationStack([]);
    navigateToPage('item-detail', { item });
  };

  const handleSellItem = async (itemData: any) => {
    if (!user) {
      toast.error('You must be logged in to add items');
      return;
    }
    try {
      await api.createItem({
        ...itemData,
        userId: user.id,
        // categoryId is no longer needed, backend handles 'category' string from itemData
      });

      await refreshAllUserData();
      setCurrentPage('profile');
      toast.success('Item listed successfully!');
    } catch (error) {
      console.error('Failed to create item:', error);
      toast.error('Failed to list item');
    }
  };

  const handleEditItem = (item: Item) => {
    if (item.status === 'exchanged') {
      toast.error('Cannot edit exchanged items');
      return;
    }
    setEditingItem(item);
    navigateToPage('edit-item');
  };

  const handleUpdateItem = async (itemData: any) => {
    if (!user || !editingItem) {
      toast.error('Unable to update item');
      return;
    }

    try {
      await api.updateItem(editingItem.id, itemData);
      await refreshAllUserData();
      setEditingItem(null);
      setCurrentPage('profile');
      toast.success('Item updated successfully!');
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;

    try {
      await api.deleteItem(itemId);
      await refreshAllUserData();
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleExchangeRequest = (itemId: string) => {
    if (!user) {
      toast.error('Please log in to request exchanges');
      setCurrentPage('login');
      return;
    }

    const availableUserItems = userItems.filter((item: Item) => item.status === 'available');
    if (availableUserItems.length === 0) {
      toast.error('You need to have available items to offer in exchange.');
      return;
    }

    const item = items.find((i: Item) => i.id === itemId);
    if (item) {
      setSelectedExchangeItem(item);
      setShowExchangeModal(true);
    }
  };

  const handleSubmitExchange = async (targetItemId: string, selectedItemIds: string[], targetItemOwnerId: string) => {
    if (!user) return;

    try {
      await api.createExchangeRequest({
        senderId: user.id,
        receiverId: targetItemOwnerId,
        itemId: targetItemId,
        offeredItemIds: selectedItemIds,
        message: "I would like to exchange this item."
      });

      setShowExchangeModal(false);
      setSelectedExchangeItem(null);
      await refreshAllUserData();
      toast.success('Exchange request sent!');
    } catch (error) {
      console.error('Failed to create exchange request:', error);
      toast.error('Failed to send exchange request');
    }
  };

  const handleAcceptExchange = async (requestId: string) => {
    try {
      await api.updateExchangeRequestStatus(requestId, 'accepted');
      await refreshAllUserData();
      toast.success('Exchange accepted!');
    } catch (error) {
      console.error('Failed to accept exchange:', error);
      toast.error('Failed to accept exchange');
    }
  };

  const handleRejectExchange = async (requestId: string) => {
    try {
      await api.updateExchangeRequestStatus(requestId, 'rejected');
      await refreshAllUserData();
      toast.success('Exchange rejected');
    } catch (error) {
      console.error('Failed to reject exchange:', error);
      toast.error('Failed to reject exchange');
    }
  };

  const handleCompleteExchange = async (requestId: string) => {
    if (!user) return;
    try {
      await api.updateExchangeRequestStatus(requestId, 'confirmed', user.id);
      await refreshAllUserData();
      toast.success('Exchange confirmed!');
    } catch (error) {
      console.error('Failed to complete exchange:', error);
      toast.error('Failed to complete exchange');
    }
  };

  const handleCancelExchange = async (requestId: string) => {
    if (!user) return;
    try {
      await api.updateExchangeRequestStatus(requestId, 'cancelled', user.id);
      await refreshAllUserData();
      toast.success('Exchange cancelled');
    } catch (error) {
      console.error('Failed to cancel exchange:', error);
      toast.error('Failed to cancel exchange');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        isAdmin={user?.email === 'admin@unimarket.edu'}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
      />

      <main className="container mx-auto px-4 py-8 mt-16">
        {currentPage === 'home' && (
          <HomePage
            items={items}
            searchQuery={searchQuery}
            onItemClick={handleItemClick}
          />
        )}

        {currentPage === 'item-detail' && selectedItem && (
          <ItemDetail
            item={selectedItem}
            onBack={handleItemDetailBack}
            onExchange={handleExchangeRequest}
            isOwner={String(user?.id) === String(selectedItem.ownerId)}
            userItems={userItems}
            exchangeRequests={exchangeRequests}
            onAcceptExchange={handleAcceptExchange}
            onRejectExchange={handleRejectExchange}
            onCompleteExchange={handleCompleteExchange}
            onSubmitExchange={handleSubmitExchange}
            onViewUserProfile={(userId) => {
              setViewedUserId(userId);
              navigateToPage('user-profile', { userId });
            }}
            allItems={items}
            onViewItem={(itemId) => {
              const item = items.find(i => i.id === itemId);
              if (item) handleItemClick(item);
            }}
          />
        )}

        {currentPage === 'sell' && (
          <AddItemForm
            onCancel={() => handleNavigate('home')}
            onSubmit={handleSellItem}
          />
        )}

        {currentPage === 'edit-item' && editingItem && (
          <AddItemForm
            existingItem={editingItem}
            onCancel={() => handleNavigate('profile')}
            onSubmit={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        )}

        {currentPage === 'profile' && user && (
          <UserProfile
            user={user}
            userItems={userItems}
            exchangeRequests={exchangeRequests}
            onEditProfile={handleEditProfile}
            onEditItem={handleEditItem}
            onItemClick={handleItemClick}
            onSellNewItem={() => navigateToPage('sell')}
            onAcceptExchange={handleAcceptExchange}
            onRejectExchange={handleRejectExchange}
            onViewItem={(itemId) => {
              const item = items.find(i => i.id === itemId);
              if (item) handleItemClick(item);
            }}
          />
        )}

        {currentPage === 'user-profile' && viewedUserId && (
          <UserProfileView
            userId={viewedUserId}
            onBack={handleGoBack}
            onItemClick={handleItemClick}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage
            onGoogleLogin={handleGoogleLogin}
            onTestLogin={handleTestLogin}
            onAdminLogin={handleAdminLogin}
            onBack={() => handleNavigate('home')}
          />
        )}

        {currentPage === 'exchange-requests' && user && (
          <ExchangeRequestsPage
            exchangeRequests={exchangeRequests}
            allItems={items}
            currentUserId={user.id}
            onBack={() => handleNavigate('profile')}
            onAcceptExchange={handleAcceptExchange}
            onRejectExchange={handleRejectExchange}
            onItemClick={handleItemClick}
            onCompleteExchange={handleCompleteExchange}
            onCancelExchange={handleCancelExchange}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPage
            items={items}
            reports={[]} // Placeholder for now
            users={[]}   // Placeholder for now
            onCensorItem={(itemId, censored) => console.log('Censor item:', itemId, censored)}
            onDeleteItem={handleDeleteItem}
            onUpdateReportStatus={(id, status) => console.log('Update report:', id, status)}
            onUpdateUserStatus={(id, status) => console.log('Update user:', id, status)}
            onItemClick={handleItemClick}
          />
        )}
      </main>

      {selectedExchangeItem && (
        <ExchangeModal
          isOpen={showExchangeModal}
          onClose={() => setShowExchangeModal(false)}
          targetItem={selectedExchangeItem}
          userItems={userItems.filter(i => i.status === 'available')}
          onSubmitExchange={(targetItemId, selectedItemIds) => {
            if (selectedExchangeItem) {
              handleSubmitExchange(targetItemId, selectedItemIds, selectedExchangeItem.ownerId);
            }
          }}
        />
      )}
    </div>
  );
}

export default AppContent;