import React, { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { Header } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { ItemDetail } from "./components/ItemDetail";
import { AddItemForm } from "./components/SellItemForm";
import { UserProfile } from "./components/UserProfile";
import { LoginPage } from "./components/LoginPage";
import { ExchangeModal } from "./components/ExchangeModal";
import { ExchangeRequestsPage } from "./components/ExchangeRequestsPage";
import { Item } from "./components/ItemCard";
import { UserDataService, UserData, ExchangeRequest } from "./data/userDataService";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";


// Mock data for items
const mockItems: Item[] = [


];

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [previousPage, setPreviousPage] = useState('home');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemNavigationStack, setItemNavigationStack] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>(() => {
    // Initialize with sample data if needed
    UserDataService.initializeWithSampleData();
    
    // Load items from all users on startup
    const allItems = UserDataService.getAllItems();
    return allItems.length > 0 ? allItems : mockItems;
  });
  const [favoriteItems, setFavoriteItems] = useState<Item[]>([]);
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

  // Helper function to navigate while tracking previous page
  const navigateToPage = (newPage: string) => {
    setPreviousPage(currentPage);
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
      // No items in stack, go back to previous page
      setCurrentPage(previousPage);
    }
  };

  const refreshItemsFromDatabase = () => {
    console.log('Refreshing items from database...');
    const allItems = UserDataService.getAllItems();
    console.log('Loaded items from database:', allItems.length, allItems);
    
    // Update items with correct isFavorited status based on current favorites
    const itemsToSet = allItems.length > 0 ? allItems : mockItems;
    const favoriteItemIds = favoriteItems.map(item => item.id);
    const itemsWithCorrectFavoriteStatus = itemsToSet.map(item => ({
      ...item,
      isFavorited: favoriteItemIds.includes(item.id)
    }));
    
    setItems(itemsWithCorrectFavoriteStatus);
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
    navigateToPage(page);
    setSelectedItem(null);
    
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
        avatar: savedUserData.picture,
        phone: savedUserData.phone,
        facebook: savedUserData.facebook,
        instagram: savedUserData.instagram,
        twitter: savedUserData.twitter,
        linkedin: savedUserData.linkedin,
      });
      setUserData(savedUserData);
      setUserItems(savedUserData.items);
      setFavoriteItems(items.filter((item: Item) => savedUserData.favoriteItems.includes(item.id)));
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
        avatar: savedUserData.picture,
        phone: savedUserData.phone,
        facebook: savedUserData.facebook,
        instagram: savedUserData.instagram,
        twitter: savedUserData.twitter,
        linkedin: savedUserData.linkedin,
      });
      setUserData(savedUserData);
      setUserItems(savedUserData.items);
      setFavoriteItems(items.filter((item: Item) => savedUserData.favoriteItems.includes(item.id)));
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
      if (!raw) return { userItems: [] as Item[], favoriteItems: [] as Item[] };
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load user data', e);
      return { userItems: [] as Item[], favoriteItems: [] as Item[] };
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

  const applyUserDataToState = (newUserItems: Item[], newFavoriteItems: Item[], storedMarketplaceItems: Item[]) => {
    if (newUserItems && newUserItems.length) setUserItems(newUserItems);
    if (newFavoriteItems && newFavoriteItems.length) setFavoriteItems(newFavoriteItems);
    
    // Update items with correct isFavorited status
    if (storedMarketplaceItems && storedMarketplaceItems.length) {
      const favoriteItemIds = newFavoriteItems.map(item => item.id);
      const itemsWithCorrectFavoriteStatus = storedMarketplaceItems.map(item => ({
        ...item,
        isFavorited: favoriteItemIds.includes(item.id)
      }));
      setItems(itemsWithCorrectFavoriteStatus);
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
        storedData.favoriteItems || [],
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
        isFavorited: false,
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
      avatar: savedUserData.picture,
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
    setSelectedItem(item);
    setItemNavigationStack([]); // Clear the stack when clicking from outside item detail
    navigateToPage('item-detail');
  };

  const handleFavoriteToggle = (itemId: string) => {
    if (!user) {
      toast.error('You must be logged in to add favorites');
      return;
    }

    const item = items.find((item: Item) => item.id === itemId);
    if (!item) return;

    const wasAlreadyFavorited = item.isFavorited;

    // Update the item's favorited status
    setItems((prevItems: Item[]) =>
      prevItems.map((item: Item) =>
        item.id === itemId
          ? { ...item, isFavorited: !item.isFavorited }
          : item
      )
    );

    // Save to JSON file
    UserDataService.toggleFavorite(user.email, itemId);
    
    if (wasAlreadyFavorited) {
      // Remove from favorites
      setFavoriteItems((prev: Item[]) => prev.filter((fav: Item) => fav.id !== itemId));
      toast.success('Removed from favorites');
    } else {
      // Add to favorites (but first check if it's not already there to prevent duplicates)
      setFavoriteItems((prev: Item[]) => {
        if (prev.some(fav => fav.id === itemId)) {
          return prev; // Already in favorites, don't add duplicate
        }
        return [...prev, { ...item, isFavorited: true }];
      });
      toast.success('Added to favorites');
    }
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
        avatar: user.picture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=60',
        rating: 4.8, // Default rating for new users
      },
      ownerId: user.email, // Use email as unique identifier
      status: 'available' as const,
      isFavorited: false,
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

      // Clean up all references to this item
      UserDataService.removeItemFromAllFavorites(itemId);
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

    // Set selected items to 'exchanging' status
    setItems((prev: Item[]) => 
      prev.map(item => {
        if (selectedItemIds.includes(item.id)) {
          UserDataService.updateUserItem(user.email, item.id, { status: 'exchanging' });
          return { ...item, status: 'exchanging' as const };
        }
        return item;
      })
    );
    
    // Update userItems as well
    setUserItems((prev: Item[]) => 
      prev.map(item => 
        selectedItemIds.includes(item.id) 
          ? { ...item, status: 'exchanging' as const }
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

      // Update exchange request status to accepted
      UserDataService.updateExchangeRequest(requestId, 'accepted');
      
      // Reject all other pending requests for the same target item
      const otherPendingRequests = userExchangeRequests.filter(req => 
        req.id !== requestId && 
        req.targetItemId === request.targetItemId && 
        req.status === 'pending'
      );
      
      otherPendingRequests.forEach(otherRequest => {
        UserDataService.updateExchangeRequest(otherRequest.id, 'rejected');
        console.log(`Auto-rejected request ${otherRequest.id} from ${otherRequest.requesterName}`);
      });
      
      // Reset offered items from the auto-rejected requests back to 'available'
      // Ensure we don't reset any items that are part of the accepted exchange
      const acceptedOfferedItems = new Set(request.offeredItemIds);
      otherPendingRequests.forEach(otherRequest => {
        otherRequest.offeredItemIds.forEach(itemId => {
          if (!acceptedOfferedItems.has(itemId)) {
            // Find which user owns this item and update it
            const allUsers = UserDataService.loadUsers().users;
            for (const userData of allUsers) {
              const itemIndex = userData.items.findIndex(item => item.id === itemId);
              if (itemIndex >= 0) {
                UserDataService.updateUserItem(userData.email, itemId, { status: 'available' });
                break;
              }
            }
          }
        });
      });
      
      // Mark all involved items as 'exchanged'
      const allItemIds = [request.targetItemId, ...request.offeredItemIds];
      
      allItemIds.forEach(itemId => {
        // Find which user owns this item and update it
        const allUsers = UserDataService.loadUsers().users;
        for (const userData of allUsers) {
          const itemIndex = userData.items.findIndex(item => item.id === itemId);
          if (itemIndex >= 0) {
            UserDataService.updateUserItem(userData.email, itemId, { status: 'exchanged' });
            break;
          }
        }
      });

      const rejectedCount = otherPendingRequests.length;
      const successMessage = rejectedCount > 0 
        ? `Exchange accepted! ${rejectedCount} other pending request(s) have been automatically rejected.`
        : 'Exchange accepted! Items have been marked as exchanged.';
      
      toast.success(successMessage);
      
      // Refresh all data comprehensively
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
      // Get the exchange request details
      const userExchangeRequests = UserDataService.getExchangeRequestsForUser(user.email);
      const request = userExchangeRequests.find(req => req.id === requestId);
      
      if (!request) {
        toast.error('Exchange request not found');
        return;
      }

      // Update exchange request status
      UserDataService.updateExchangeRequest(requestId, 'rejected');
      
      // Mark offered items as 'available' again (they were set to 'exchanging')
      request.offeredItemIds.forEach(itemId => {
        // Find which user owns this item and update it
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
      
      // Refresh all data comprehensively
      refreshAllUserData();
    } catch (error) {
      console.error('Error rejecting exchange:', error);
      toast.error('Failed to reject exchange');
    }
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
            onFavoriteToggle={handleFavoriteToggle}
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
            userItems={userItems}
            onSubmitExchange={handleSubmitExchange}
            showExchangeInterface={false}
            allItems={items}
            onViewItem={(itemId: string) => {
              const itemToView = items.find((item: Item) => item.id === itemId);
              if (itemToView && selectedItem) {
                // Push current item to the stack before navigating to the new one
                setItemNavigationStack((prev: any) => [...prev, selectedItem]);
                setSelectedItem(itemToView);
              }
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
              setCurrentPage(previousPage);
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
          />
        );
      
      case 'profile':
        return (
          <UserProfile
            userItems={userItems}
            favoriteItems={favoriteItems}
            user={user}
            onItemClick={handleItemClick}
            onSellNewItem={() => navigateToPage('sell')}
            onEditItem={handleEditItem}
            onEditProfile={handleEditProfile}
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
          />
        ) : null;
      
      default:
        return (
          <HomePage
            items={items}
            searchQuery={searchQuery}
            onItemClick={handleItemClick}
            onFavoriteToggle={handleFavoriteToggle}
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