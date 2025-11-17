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
import { UserDataService, UserData, ExchangeRequest } from "./data/userDataService";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { AdminPage } from "./components/AdminPage"; // existing import, AdminPage now richer


// Mock data for items
const mockItems: Item[] = [


];

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
  const [items, setItems] = useState<Item[]>(() => {
    // Initialize with sample data if needed
    //UserDataService.initializeWithSampleData();
    
    // Load items from all users on startup
    const allItems = UserDataService.getAllItems();
    return allItems.length > 0 ? allItems : mockItems;
  });
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ 
    name: string; 
    email: string; 
    avatar: string;
    phone?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  } | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedExchangeItem, setSelectedExchangeItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [lastDbUpdate, setLastDbUpdate] = useState<string>(UserDataService.getLastUpdateTime());

  // Push a snapshot for the target page into the history.
  // Accept explicit context to avoid reading stale state (setSelectedItem is async).
  const navigateToPage = (newPage: string, context?: { item?: Item | null; userId?: string | null; itemStack?: Item[] }, push = true) => {
    const snapshot = {
      page: newPage,
      item: context?.item ?? (newPage === 'item-detail' ? selectedItem : null),
      userId: context?.userId ?? (newPage === 'user-profile' ? viewedUserId : null),
      // avoid mixing ?? and || without parentheses — prefer simple nullish coalesce
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

    // Apply page change. Caller should set selectedItem/viewedUserId as needed BEFORE calling navigateToPage,
    // or pass them in the context param.
    setCurrentPage(newPage);
  };
  
  // Handle back navigation from ItemDetail
  const handleItemDetailBack = () => {
    if (itemNavigationStack.length > 0) {
      // Pop the last item from the stack and navigate back to it
      const previousItem = itemNavigationStack[itemNavigationStack.length - 1];
      const newStack = itemNavigationStack.slice(0, -1);
      setItemNavigationStack(newStack);
      setSelectedItem(previousItem);
    } else {
      // No items in stack, go back using navigation history
      handleGoBack();
    }
  };

  const handleGoBack = () => {
    if (navigationHistory.length <= 1) {
      // Only home in history, stay on home
      setCurrentPage('home');
      setSelectedItem(null);
      setViewedUserId(null);
      setItemNavigationStack([]);
      return;
    }

    // If we're on user-profile, prefer restoring the most recent item-detail snapshot
    if (currentPage === 'user-profile') {
      // Consider history excluding the current top (user-profile) snapshot
      const entries = navigationHistory.slice(0, -1);
      // Find last index of an item-detail entry
      let idx = -1;
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].page === 'item-detail') {
          idx = i;
          break;
        }
      }

      if (idx >= 0) {
        // Restore up to that item-detail snapshot
        const newHistory = entries.slice(0, idx + 1);
        const entry = entries[idx];
        setNavigationHistory(newHistory);
        setCurrentPage(entry.page);
        setSelectedItem(entry.item || null);
        setViewedUserId(entry.userId || null);
        setItemNavigationStack(entry.itemStack || []);
        return;
      }
      // fallback to normal pop if no item-detail snapshot found
    }

    // Default: pop one entry and restore previous
    const newHistory = navigationHistory.slice(0, -1);
    const previousEntry = newHistory[newHistory.length - 1];

    setNavigationHistory(newHistory);
    setCurrentPage(previousEntry.page);
    setSelectedItem(previousEntry.item || null);
    setViewedUserId(previousEntry.userId || null);
    setItemNavigationStack(previousEntry.itemStack || []);
   };

  const refreshItemsFromDatabase = () => {
    console.log('Refreshing items from database...');
    const allItems = UserDataService.getAllItems();
    console.log('Loaded items from database:', allItems.length, allItems);
    
    // No favorites feature — set items directly from DB
    const itemsToSet = allItems.length > 0 ? allItems : mockItems;
    setItems(itemsToSet);
    setLastDbUpdate(UserDataService.getLastUpdateTime());
  };

  const refreshAllUserData = () => {
    console.log('Refreshing all user data...');
    refreshItemsFromDatabase();
    
    // Refresh current user's data if logged in
    if (user && userData) {
      const updatedUserData = UserDataService.getUser(user.email);
      if (updatedUserData) {
        console.log('Updating user data for:', user.email);
        setUserData(updatedUserData);
        setUserItems(updatedUserData.items);
      }
    }
  };

  // Check for database updates periodically
  useEffect(() => {
    const checkForUpdates = () => {
      const currentDbTime = UserDataService.getLastUpdateTime();
      if (currentDbTime !== lastDbUpdate) {
        console.log('Database update detected, refreshing all data...');
        refreshAllUserData();
      }
    };

    // Check for updates every 2 seconds
    const interval = setInterval(checkForUpdates, 2000);
    
    return () => clearInterval(interval);
  }, [lastDbUpdate, user, userData]);

  const handleNavigate = (page: string) => {
    // For navigation that completely resets state
    setNavigationHistory([{ page: 'home' }, { page, item: null, userId: null, itemStack: [] }]);
    setCurrentPage(page);
    setSelectedItem(null);
    setViewedUserId(null);
    setItemNavigationStack([]);
    
     // Refresh items when navigating to home page
     if (page === 'home') {
       refreshItemsFromDatabase();
     }
   };

  const handleGoogleLogin = (credentialResponse: any) => {
    console.log('Google login response:', credentialResponse);

    // 1) Token flow (access_token) -> call token handler
    if (credentialResponse && credentialResponse.access_token) {
      handleGoogleLoginSuccess(credentialResponse).catch(err => {
        console.error('Error in token login handler', err);
        toast.error('Google login failed during token handling.');
      });
      return;
    }

    // 2) Direct profile object (some internal flows may pass { name, email, picture })
    if (credentialResponse && credentialResponse.name && credentialResponse.email) {
      const userData = {
        name: credentialResponse.name,
        email: credentialResponse.email,
        avatar: credentialResponse.picture || credentialResponse.avatar || ''
      };
      
      // Save user data to JSON file
      const savedUserData = UserDataService.saveUser({
        email: userData.email,
        name: userData.name,
        picture: userData.avatar
      });
      
      console.log('User logged in with data:', savedUserData);
      console.log('User has items:', savedUserData.items.length);
      
      setUser({
        name: savedUserData.name,
        email: savedUserData.email,
        avatar: savedUserData.picture, // Ensure picture field is mapped to avatar
        phone: savedUserData.phone,
        facebook: savedUserData.facebook,
        instagram: savedUserData.instagram,
        twitter: savedUserData.twitter,
        linkedin: savedUserData.linkedin,
      });
      setUserData(savedUserData);
      setUserItems(savedUserData.items);
      setIsLoggedIn(true);
      setCurrentPage('profile');
      toast.success(`Successfully logged in as ${userData.name}`);
      return;
    }

    // 3) ID token / credential JWT case (Google One Tap / button returns credential)
    try {
      if (!credentialResponse || !(credentialResponse.credential || credentialResponse.id_token || credentialResponse.idToken)) {
        console.error('No credential or token found in Google login response:', credentialResponse);
        toast.error('Google login failed: no credential returned');
        return;
      }

      const token = credentialResponse.credential || credentialResponse.id_token || credentialResponse.idToken;
      const decoded = jwtDecode(token) as any;
      console.log('Decoded JWT:', decoded);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture
      };
      
      // Save user data to JSON file
      const savedUserData = UserDataService.saveUser({
        email: userData.email,
        name: userData.name,
        picture: userData.avatar
      });
      
      console.log('Google user logged in with data:', savedUserData);
      console.log('Google user has items:', savedUserData.items.length);
      
      setUser({
        name: savedUserData.name,
        email: savedUserData.email,
        avatar: savedUserData.picture, // Ensure picture field is mapped to avatar
        phone: savedUserData.phone,
        facebook: savedUserData.facebook,
        instagram: savedUserData.instagram,
        twitter: savedUserData.twitter,
        linkedin: savedUserData.linkedin,
      });
      setUserData(savedUserData);
      setUserItems(savedUserData.items);
      setIsLoggedIn(true);
      setCurrentPage('profile');
      toast.success('Successfully logged in with Google!');
    } catch (error) {
      console.error('Error processing Google login response:', error, credentialResponse);
      toast.error('Failed to process login');
    }
  };

  // --- New: token-based login success handler and helpers ---
  type GoogleUser = { name: string; email: string; picture?: string };

  const loadUserData = (email: string) => {
    try {
      const raw = localStorage.getItem(`userData:${email}`);
      if (!raw) return { userItems: [] as Item[] };
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load user data', e);
      return { userItems: [] as Item[] };
    }
  };

  const loadAllMarketplaceItems = () => {
    try {
      const raw = localStorage.getItem('marketplaceItems');
      if (!raw) return items;
      return JSON.parse(raw) as Item[];
    } catch (e) {
      console.error('Failed to load marketplace items', e);
      return items;
    }
  };

  const applyUserDataToState = (newUserItems: Item[], storedMarketplaceItems: Item[]) => {
    if (newUserItems && newUserItems.length) setUserItems(newUserItems);
    
    // No favorites — use marketplace items as-is
    if (storedMarketplaceItems && storedMarketplaceItems.length) {
      setItems(storedMarketplaceItems);
    }
  };

  const handleGoogleLoginSuccess = async (tokenResponse: any) => {
    // tokenResponse should contain access_token
    if (!tokenResponse || !tokenResponse.access_token) {
      toast.error('Google login did not return an access token.');
      return;
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Google user information');
      }

      const data = await response.json();
      const userProfile: GoogleUser = {
        name: data.name ?? 'Google User',
        email: data.email ?? '',
        picture: data.picture ?? undefined,
      };

      // set user and navigate
      setUser({ name: userProfile.name, email: userProfile.email, avatar: userProfile.picture ?? '' });
      setIsLoggedIn(true);
      // Use centralized navigation so modal is closed
      handleNavigate('profile');

      // Load persisted data for this user (if any)
      const storedData = loadUserData(userProfile.email);
      const storedMarketplaceItems = loadAllMarketplaceItems();
      applyUserDataToState(
        storedData.userItems || [],
        storedMarketplaceItems || []
      );

      toast.success(`Logged in as ${userProfile.name}`);
    } catch (error) {
      console.error('Failed to fetch Google user info', error);
      toast.error('Failed to fetch Google user information. Please try again.');
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
    setCurrentPage('home');
    toast.success('Successfully logged out!');
  };

  const handleEditProfile = (profileData: any) => {
    if (!user?.email) return;
    
    // Update the user state with all contact details
    setUser((prev: any) => prev ? { 
      ...prev, 
      name: profileData.name,
      phone: profileData.phone,
      facebook: profileData.facebook,
      instagram: profileData.instagram,
      twitter: profileData.twitter,
      linkedin: profileData.linkedin,
    } : null);
    
    // Update the user data in storage
    const currentUserData = UserDataService.getUser(user.email);
    if (currentUserData) {
      const updatedUserData = {
        ...currentUserData,
        name: profileData.name,
        phone: profileData.phone,
        facebook: profileData.facebook,
        instagram: profileData.instagram,
        twitter: profileData.twitter,
        linkedin: profileData.linkedin,
      };
      UserDataService.saveUser(updatedUserData);
      setUserData(updatedUserData);
    }
    
    toast.success('Profile updated successfully!');
  };

  const handleTestLogin = () => {
    const testUser = {
      name: 'Test User',
      email: 'test@university.edu',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=60'
    };
    
    // Create test user with a sample item and contact details
    const savedUserData = UserDataService.saveUser({
      email: testUser.email,
      name: testUser.name,
      picture: testUser.avatar,
      phone: '+1 (555) 123-4567',
      facebook: 'https://facebook.com/testuser',
      instagram: 'https://instagram.com/testuser',
      twitter: 'https://twitter.com/testuser',
      linkedin: 'https://linkedin.com/in/testuser',
    });

    // Add a test item if user doesn't have any
    if (savedUserData.items.length === 0) {
      const testItem: Item = {
        id: `test_item_${Date.now()}`,
        title: 'Test Item for Exchange',
        location: 'Test Campus',
        timePosted: new Date().toISOString(),
        category: 'books',
        condition: 'good',
        images: ['https://images.unsplash.com/photo-1608453162650-cba45689c284?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBib29rc3xlbnwxfHx8fDE3NTgyNDY4NTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        description: 'A test item that you can use to offer in exchanges.',
        seller: {
          name: testUser.name,
          avatar: testUser.avatar,
          rating: 4.8,
        },
        status: 'available' as const,
        ownerId: testUser.email,
      };
      
      UserDataService.addItemToUser(testUser.email, testItem);
      const updatedUserData = UserDataService.getUser(testUser.email);
      if (updatedUserData) {
        setUserData(updatedUserData);
        setUserItems(updatedUserData.items);
      }
      
      // Refresh all items
      refreshItemsFromDatabase();
    } else {
      setUserData(savedUserData);
      setUserItems(savedUserData.items);
    }
    
    setUser({
      name: savedUserData.name,
      email: savedUserData.email,
      avatar: savedUserData.picture, // Ensure picture field is mapped to avatar
      phone: savedUserData.phone,
      facebook: savedUserData.facebook,
      instagram: savedUserData.instagram,
      twitter: savedUserData.twitter,
      linkedin: savedUserData.linkedin,
    });
    setIsLoggedIn(true);
    setCurrentPage('profile');
    toast.success('Test login successful! You now have items to exchange.');
  };

  const handleItemClick = (item: Item) => {
    // Set selection and push snapshot for item-detail explicitly
    setSelectedItem(item);
    setItemNavigationStack([]); // Clear the stack when clicking from outside item detail
    navigateToPage('item-detail', { item });
  };

  const handleSellItem = (itemData: any) => {
    if (!user) {
      toast.error('You must be logged in to add items');
      return;
    }

    const newItem: Item = {
      ...itemData,
      id: Date.now().toString(),
      timePosted: new Date().toISOString(),
      seller: {
        name: user.name,
        avatar: user.avatar, // Make sure user.avatar is set from picture field
        rating: 4.8,
      },
      ownerId: user.email,
      status: 'available' as const,
    };
    
    console.log('Adding new item:', newItem);
    console.log('Current user:', user);
    
    // Save item to user's data in JSON file
    UserDataService.addItemToUser(user.email, newItem);
    console.log('Item saved to database for user:', user.email);
    
    // Verify item was saved by checking database
    const savedUser = UserDataService.getUser(user.email);
    console.log('User data after saving item:', savedUser);
    
    // Update local state
    setItems((prev: Item[]) => {
      const updated = [newItem, ...prev];
      console.log('Updated items array:', updated);
      return updated;
    });
    setUserItems((prev: Item[]) => [newItem, ...prev]);
    
    // Update userData state
    if (userData) {
      setUserData({
        ...userData,
        items: [newItem, ...userData.items]
      });
    }
    
    // Refresh all items from database to ensure consistency
    const refreshedItems = UserDataService.getAllItems();
    console.log('Refreshed items from database:', refreshedItems);
    setItems(refreshedItems);
    
    setCurrentPage('profile');
    toast.success('Item listed successfully!');
  };

  const handleEditItem = (item: Item) => {
    if (item.status === 'exchanged') {
      toast.error('Cannot edit exchanged items');
      return;
    }
    setEditingItem(item);
    navigateToPage('edit-item');
  };

  const handleUpdateItem = (itemData: any) => {
    if (!user || !editingItem) {
      toast.error('Unable to update item');
      return;
    }

    try {
      const updatedItem = {
        ...editingItem,
        ...itemData,
        // Preserve original metadata
        id: editingItem.id,
        seller: editingItem.seller,
        status: editingItem.status,
        ownerId: editingItem.ownerId,
        // Update timestamp
        timePosted: new Date().toLocaleDateString(),
      };

      UserDataService.updateUserItem(user.email, editingItem.id, itemData);
      
      // Refresh items
      refreshItemsFromDatabase();
      refreshAllUserData();
      
      setEditingItem(null);
      setCurrentPage('profile');
      toast.success('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!user) {
      toast.error('Unable to delete item');
      return;
    }

    try {
      // Find the item to delete
      const itemToDelete = userItems.find((item: Item) => item.id === itemId);
      if (!itemToDelete) {
        toast.error('Item not found');
        return;
      }

      // Check if item has accepted exchanges (these cannot be deleted)
      const database = UserDataService.loadUsers();
      const acceptedExchanges = database.users.flatMap(user => user.exchangeRequests)
        .filter(req => req.targetItemId === itemId && req.status === 'accepted');
      
      if (acceptedExchanges.length > 0) {
        toast.error('Cannot delete item with accepted exchange requests');
        return;
      }

      // Remove item from user's items
      const updatedUserData = UserDataService.getUser(user.email);
      if (updatedUserData) {
        const updatedItems = updatedUserData.items.filter(item => item.id !== itemId);
        UserDataService.saveUser({
          ...updatedUserData,
          items: updatedItems
        });
      }

      // Clean up other references to this item (favorites no longer used)
      UserDataService.removeExchangeRequestsForItem(itemId);

      // Refresh items
      refreshItemsFromDatabase();
      refreshAllUserData();
      
      setEditingItem(null);
      setCurrentPage('profile');
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleExchangeRequest = (itemId: string) => {
    console.log('Exchange request clicked for item:', itemId);
    console.log('Current user:', user);
    console.log('User items available for exchange:', userItems.filter((item: Item) => item.status === 'available'));
    
    if (!user) {
      toast.error('Please log in to request exchanges');
      setCurrentPage('login');
      return;
    }

    const availableUserItems = userItems.filter((item: Item) => item.status === 'available');
    if (availableUserItems.length === 0) {
      toast.error('You need to have available items to offer in exchange. Would you like to add some items first?', {
        action: {
          label: 'Add Item',
          onClick: () => setCurrentPage('sell'),
        },
      });
      return;
    }

    const item = items.find((i: Item) => i.id === itemId);
    if (item) {
      console.log('Opening exchange modal for item:', item.title);
      console.log('Current modal state - showExchangeModal:', showExchangeModal);
      console.log('Setting selectedExchangeItem to:', item);
      setSelectedExchangeItem(item);
      setShowExchangeModal(true);
      console.log('Modal should now be visible');
    } else {
      toast.error('Item not found');
    }
  };

  const handleSubmitExchange = (targetItemId: string, selectedItemIds: string[]) => {
    if (!user) {
      toast.error('Error: User not logged in');
      return;
    }

    if (selectedItemIds.length === 0) {
      toast.error('Error: No items selected for exchange');
      return;
    }

    // Find the target item from the items list
    const targetItem = items.find((item: Item) => item.id === targetItemId);
    if (!targetItem) {
      toast.error('Error: Target item not found');
      return;
    }

    // Create exchange request
    const exchangeRequest: ExchangeRequest = {
      id: `exchange_${Date.now()}`,
      targetItemId,
      offeredItemIds: selectedItemIds,
      requesterId: user.email,
      requesterName: user.name,
      targetOwnerId: targetItem.ownerId || targetItem.seller.name || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save exchange request to JSON
    UserDataService.addExchangeRequest(exchangeRequest);

    // Set offered items to 'pending_offer' status (blocked from other requests)
    setItems((prev: Item[]) =>
      prev.map(item => {
        if (selectedItemIds.includes(item.id)) {
          UserDataService.updateUserItem(user.email, item.id, { status: 'pending_offer' });
          return { ...item, status: 'pending_offer' as const };
        }
        return item;
      })
    );

    // Update userItems as well
    setUserItems((prev: Item[]) =>
      prev.map(item =>
        selectedItemIds.includes(item.id)
          ? { ...item, status: 'pending_offer' as const }
          : item
      )
    );

    // Close the modal
    setShowExchangeModal(false);
    setSelectedExchangeItem(null);

    toast.success(`Exchange request sent for ${selectedItemIds.length} item(s)!`);
  };

  const handleAcceptExchange = (requestId: string) => {
    if (!user) {
      toast.error('User not logged in');
      return;
    }

    try {
      // Get the exchange request details
      const userExchangeRequests = UserDataService.getExchangeRequestsForUser(user.email);
      const request = userExchangeRequests.find(req => req.id === requestId);

      if (!request) {
        toast.error('Exchange request not found');
        return;
      }

      // Set request to accepted
      UserDataService.updateExchangeRequest(requestId, 'accepted');

      // Reject all other pending requests for same target item
      const otherPendingRequests = userExchangeRequests.filter(req =>
        req.id !== requestId &&
        req.targetItemId === request.targetItemId &&
        req.status === 'pending'
      );

      otherPendingRequests.forEach(otherRequest => {
        UserDataService.updateExchangeRequest(otherRequest.id, 'rejected');
        // Reset offered items from these rejected requests back to 'available'
        otherRequest.offeredItemIds.forEach(itemId => {
          const allUsers = UserDataService.loadUsers().users;
          for (const u of allUsers) {
            const itemIndex = u.items.findIndex(i => i.id === itemId);
            if (itemIndex >= 0) {
              UserDataService.updateUserItem(u.email, itemId, { status: 'available' });
              break;
            }
          }
        });
      });

      // Mark accepted items as 'exchanging' (locks items during exchange)
      // update target item and offered items
      const allItemIds = [request.targetItemId, ...request.offeredItemIds];

      allItemIds.forEach(itemId => {
        const allUsers = UserDataService.loadUsers().users;
        for (const u of allUsers) {
          const itemIndex = u.items.findIndex(i => i.id === itemId);
          if (itemIndex >= 0) {
            UserDataService.updateUserItem(u.email, itemId, { status: 'exchanging' });
            break;
          }
        }
      });

      toast.success('Exchange accepted! Items are now locked for exchanging.');

      // Refresh UI
      refreshAllUserData();
    } catch (error) {
      console.error('Error accepting exchange:', error);
      toast.error('Failed to accept exchange');
    }
  };

  const handleRejectExchange = (requestId: string) => {
    if (!user) {
      toast.error('User not logged in');
      return;
    }

    try {
      const userExchangeRequests = UserDataService.getExchangeRequestsForUser(user.email);
      const request = userExchangeRequests.find(req => req.id === requestId);

      if (!request) {
        toast.error('Exchange request not found');
        return;
      }

      // Update exchange request status
      UserDataService.updateExchangeRequest(requestId, 'rejected');

      // Mark offered items back to 'available'
      request.offeredItemIds.forEach(itemId => {
        const allUsers = UserDataService.loadUsers().users;
        for (const userData of allUsers) {
          const itemIndex = userData.items.findIndex(item => item.id === itemId);
          if (itemIndex >= 0) {
            UserDataService.updateUserItem(userData.email, itemId, { status: 'available' });
            break;
          }
        }
      });

      toast.info('Exchange request rejected. Offered items are now available again.');

      refreshAllUserData();
    } catch (error) {
      console.error('Error rejecting exchange:', error);
      toast.error('Failed to reject exchange');
    }
  };

  const handleCompleteExchange = (requestId: string) => {
    if (!user) {
      toast.error('User not logged in');
      return;
    }
 
    try {
      // Confirm completion from the current user. Returns true if both confirmed.
      const bothConfirmed = UserDataService.confirmExchangeCompletion(requestId, user.email);

      if (!bothConfirmed) {
        // Notify user that their confirmation is recorded and wait for other party
        toast.success('Marked as completed — waiting for the other party to confirm.');
        refreshAllUserData();
        return;
      }

      // Both confirmed — finalize the exchange
      const userExchangeRequests = UserDataService.getExchangeRequestsForUser(user.email);
      const request = userExchangeRequests.find(req => req.id === requestId);
      if (!request) {
        toast.error('Exchange request not found');
        return;
      }

      UserDataService.updateExchangeRequest(requestId, 'completed');

      const allItemIds = [request.targetItemId, ...request.offeredItemIds];
      allItemIds.forEach(itemId => {
        const allUsers = UserDataService.loadUsers().users;
        for (const u of allUsers) {
          const itemIndex = u.items.findIndex(i => i.id === itemId);
          if (itemIndex >= 0) {
            UserDataService.updateUserItem(u.email, itemId, { status: 'exchanged' });
            break;
          }
        }
      });

      toast.success('Exchange completed — items marked as exchanged.');
      refreshAllUserData();
    } catch (error) {
      console.error('Error completing exchange:', error);
      toast.error('Failed to complete exchange');
    }
  };

  const handleCancelExchange = (requestId: string) => {
    if (!user) {
      toast.error('User not logged in');
      return;
    }

    try {
      // Locate the exchange request (from any user's copy) to get all involved item IDs
      const allUsers = UserDataService.loadUsers().users;
      let request: ExchangeRequest | undefined;
      for (const u of allUsers) {
        const r = u.exchangeRequests.find(req => req.id === requestId);
        if (r) {
          request = r;
          break;
        }
      }

      if (!request) {
        toast.error('Exchange request not found');
        return;
      }

      // Mark request cancelled across all user copies
      UserDataService.updateExchangeRequest(requestId, 'cancelled');

      // Revert target item AND all offered items back to 'available'
      const affectedItemIds = [request.targetItemId, ...request.offeredItemIds];
      affectedItemIds.forEach(itemId => {
        const users = UserDataService.loadUsers().users;
        for (const u of users) {
          const itemIndex = u.items.findIndex(i => i.id === itemId);
          if (itemIndex >= 0) {
            UserDataService.updateUserItem(u.email, itemId, { status: 'available' });
            break;
          }
        }
      });

      // Optionally clear confirmation flags on that request copies (not strictly necessary)
      // (leave flags as is or extend UserDataService to clear them if desired)

      toast.success('Exchange request cancelled and involved items reverted to available.');
      refreshAllUserData();
    } catch (error) {
      console.error('Error cancelling exchange', error);
      toast.error('Failed to cancel exchange');
    }
  };

  // Admin handlers (added/updated)
  const handleAdminLogin = () => {
    const saved = UserDataService.saveUser({
      email: 'admin@university.edu',
      name: 'Admin User',
      picture: '',
      isAdmin: true
    } as any);
    setUser({
      name: saved.name,
      email: saved.email,
      avatar: saved.picture,
    });
    setIsLoggedIn(true);
    setCurrentPage('admin');
    toast.success('Logged in as admin (demo)');
  };

  // Helper to refresh data after admin actions
  const adminRefreshAll = () => {
    refreshAllUserData();
    setItems(UserDataService.getAllItems());
  };

  const handleAdminCensorItem = (itemId: string, censored: boolean) => {
    // Find owner and update item with a censored flag
    const allUsers = UserDataService.loadUsers().users;
    for (const u of allUsers) {
      const idx = u.items.findIndex(i => i.id === itemId);
      if (idx >= 0) {
        const updated = { ...u.items[idx], censored };
        UserDataService.updateUserItem(u.email, itemId, updated as any);
        break;
      }
    }
    adminRefreshAll();
    toast.success(`Item ${censored ? 'censored' : 'uncensored'}`);
  };

  const handleAdminDeleteItem = (itemId: string) => {
    UserDataService.deleteItem(itemId);
    adminRefreshAll();
    toast.success('Item deleted');
  };

  const handleAdminUpdateReport = (reportId: string, status: any, note?: string) => {
    // update report status in storage
    const db = UserDataService.loadUsers();
    db.reports = db.reports || [];
    const idx = db.reports.findIndex(r => r.id === reportId);
    if (idx >= 0) {
      db.reports[idx].status = status;
      if (status === 'resolved') {
        db.reports[idx].resolved = true;
        db.reports[idx].resolvedBy = user?.email || 'admin';
        db.reports[idx].resolvedAt = new Date().toISOString();
      }
      // store admin note if desired (add notes field)
      (db.reports[idx] as any).adminNote = note;
      UserDataService.saveUsers(db);
    }
    adminRefreshAll();
    toast.success('Report updated');
  };

  const handleAdminUpdateUserStatus = (userId: string, status: any, reason?: string) => {
    const db = UserDataService.loadUsers();
    const idx = db.users.findIndex(u => u.email === userId || u.id === userId);
    if (idx >= 0) {
      (db.users[idx] as any).status = status;
      if (reason) (db.users[idx] as any).modReason = reason;
      UserDataService.saveUsers(db);
    }
    adminRefreshAll();
    toast.success('User status updated');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
      case 'categories':
        return (
          <HomePage
            items={items}
            searchQuery={searchQuery}
            onItemClick={handleItemClick}
            onRefresh={refreshItemsFromDatabase}
            currentUser={user}
          />
        );
      
      case 'item-detail':
        return selectedItem ? (
          <ItemDetail
            item={selectedItem}
            onBack={handleItemDetailBack}
            onExchange={handleExchangeRequest}
            isOwner={selectedItem.ownerId === (user?.email || 'current-user')}
            exchangeRequests={userData ? userData.exchangeRequests.filter((req: ExchangeRequest) => req.targetItemId === selectedItem.id) : []}
            onAcceptExchange={handleAcceptExchange}
            onRejectExchange={handleRejectExchange}
            onCompleteExchange={handleCompleteExchange}
            userItems={userItems}
            onSubmitExchange={handleSubmitExchange}
            showExchangeInterface={false}
            allItems={items}
            onViewItem={(itemId: string) => {
              const itemToView = items.find((item: Item) => item.id === itemId);
              if (itemToView && selectedItem) {
                setItemNavigationStack((prev: any) => [...prev, selectedItem]);
                setSelectedItem(itemToView);
                // push navigation snapshot with the new item
                navigateToPage('item-detail', { item: itemToView });
              }
            }}
           onViewUserProfile={(userEmail: string) => {
              // Navigate to user-profile and record which user we're viewing
              setViewedUserId(userEmail);
              navigateToPage('user-profile', { userId: userEmail });
            }}
          />
        ) : null;
      
      case 'sell':
        return (
          <AddItemForm
            onSubmit={handleSellItem}
            onCancel={() => setCurrentPage('home')}
          />
        );
      
      case 'edit-item':
        return editingItem ? (
          <AddItemForm
            onSubmit={handleUpdateItem}
            onCancel={() => {
              setEditingItem(null);
              setCurrentPage('profile');
            }}
            onDelete={handleDeleteItem}
            existingItem={editingItem}
          />
        ) : null;
      
      case 'login':
        return (
          <LoginPage
            onGoogleLogin={handleGoogleLogin}
            onBack={() => setCurrentPage('home')}
            onTestLogin={handleTestLogin}
           onAdminLogin={handleAdminLogin}
          />
        );
      
      case 'profile':
        return (
          <UserProfile
            userItems={userItems}
            user={user}
            exchangeRequests={userData?.exchangeRequests || []}
            onItemClick={handleItemClick}
            onSellNewItem={() => navigateToPage('sell')}
            onEditItem={handleEditItem}
            onEditProfile={handleEditProfile}
            onAcceptExchange={handleAcceptExchange}
            onRejectExchange={handleRejectExchange}
            onViewItem={(itemId?: string) => {
              if (!itemId) return;
              const itemToView = items.find((item: Item) => item.id === itemId);
              if (itemToView) {
                setItemNavigationStack([]); // clear stack
                setSelectedItem(itemToView);
                navigateToPage('item-detail', { item: itemToView });
              }
            }}
            onCompleteExchange={handleCompleteExchange}
            onCancelExchange={handleCancelExchange}
          />
        );
      
      case 'exchanges':
        return user && userData ? (
          <ExchangeRequestsPage
            exchangeRequests={userData.exchangeRequests}
            allItems={items}
            currentUserEmail={user.email}
            onAcceptExchange={handleAcceptExchange}
            onRejectExchange={handleRejectExchange}
            onBack={() => setCurrentPage('profile')}
            onItemClick={handleItemClick}
            onCompleteExchange={handleCompleteExchange}
            onCancelExchange={handleCancelExchange}
          />
        ) : null;

      case 'user-profile':
         if (!viewedUserId) return null;
         const viewedUserData = UserDataService.getUser(viewedUserId);
         if (!viewedUserData) return null;
         return (
           <UserProfileView
             user={{
               name: viewedUserData.name,
               email: viewedUserData.email,
               avatar: viewedUserData.picture,
               rating: 4.8,
             }}
             userItems={viewedUserData.items}
             onBack={() => {
              // Pop from history and restore full state (page, item, userId, itemStack)
                handleGoBack();
              }}
             onItemClick={(item: Item) => {
               // set item then navigate (pass item in context to ensure history snapshot is correct)
               setSelectedItem(item);
               setItemNavigationStack([]);
               navigateToPage('item-detail', { item });
             }}
           />
         );

      case 'admin':
        // only allow admin users
        if (!user || !user.email) return null;
        const adminUser = UserDataService.getUser(user.email);
        if (!adminUser || !adminUser.isAdmin) return <HomePage items={items} searchQuery={searchQuery} onItemClick={handleItemClick} currentUser={user} />;
        // Build users and reports data for admin page
        const db = UserDataService.loadUsers();
        const adminReports = (db.reports || []).map(r => ({
          id: r.id,
          itemId: r.targetItemId || r.targetItemId || '',
          itemTitle: r.targetItemId ? (items.find(it => it.id === r.targetItemId)?.title || 'Item') : '',
          reporterName: r.reporterId,
          reporterAvatar: '',
          reason: r.reason || '',
          description: '',
          date: r.createdAt,
          status: r.status as any
        }));
        const adminUsers = db.users.map(u => ({
          id: u.id,
          name: u.name,
          avatar: u.picture,
          email: u.email,
          joinDate: new Date(u.createdAt).toLocaleDateString(),
          rating: 4.8,
          itemsListed: u.items.length,
          itemsSold: 0,
          status: (u as any).status || 'active',
          reports: (db.reports || []).filter(r => r.targetUserId === u.email).length
        }));

        return (
          <AdminPage
            items={items}
            reports={adminReports}
            users={adminUsers}
            onCensorItem={handleAdminCensorItem}
            onDeleteItem={handleAdminDeleteItem}
            onUpdateReportStatus={handleAdminUpdateReport}
            onUpdateUserStatus={handleAdminUpdateUserStatus}
            onItemClick={handleItemClick}
          />
        );

      default:
        return (
          <HomePage
            items={items}
            searchQuery={searchQuery}
            onItemClick={handleItemClick}
            currentUser={user}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onProfileClick={handleProfileClick}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoggedIn={isLoggedIn}
        user={user}
      />
      
      <main className="flex-1 flex flex-col">
        {renderCurrentPage()}
      </main>
      
      <Toaster />
      
      {showExchangeModal && selectedExchangeItem && user && (
        <ExchangeModal
          targetItem={selectedExchangeItem}
          userItems={userItems}
          isOpen={showExchangeModal}
          onClose={() => {
            console.log('Exchange modal closed');
            setShowExchangeModal(false);
            setSelectedExchangeItem(null);
          }}
          onSubmitExchange={handleSubmitExchange}
        />
      )}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}