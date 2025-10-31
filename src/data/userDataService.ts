import { Item } from '../components/ItemCard';

export interface UserData {
  id: string;
  email: string;
  name: string;
  picture: string;
  createdAt: string;
  lastLogin: string;
  items: Item[];
  favoriteItems: string[]; // Array of item IDs
  exchangeRequests: ExchangeRequest[];
  phone?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface ExchangeRequest {
  id: string;
  targetItemId: string;
  offeredItemIds: string[];
  requesterId: string;
  requesterName: string;
  targetOwnerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface UserDatabase {
  users: UserData[];
  lastUpdated: string;
}

// In a real application, this would be replaced with actual API calls to a backend
export class UserDataService {
  private static readonly STORAGE_KEY = 'unimarket_global_database';
  private static readonly USER_KEY = 'unimarket_current_user';

  // Load users from localStorage (simulating shared JSON database)
  static loadUsers(): UserDatabase {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    
    return {
      users: [],
      lastUpdated: new Date().toISOString()
    };
  }

  // Save users to localStorage (simulating JSON file)
  static saveUsers(database: UserDatabase): void {
    try {
      database.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(database, null, 2));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Get user by email
  static getUser(email: string): UserData | null {
    const database = this.loadUsers();
    return database.users.find(user => user.email === email) || null;
  }

  // Create or update user
  static saveUser(userData: Partial<UserData> & { email: string }): UserData {
    const database = this.loadUsers();
    const existingUserIndex = database.users.findIndex(user => user.email === userData.email);
    
    const now = new Date().toISOString();
    
    if (existingUserIndex >= 0) {
      // Update existing user
      const existingUser = database.users[existingUserIndex];
      const updatedUser: UserData = {
        ...existingUser,
        ...userData,
        lastLogin: now,
      };
      database.users[existingUserIndex] = updatedUser;
      this.saveUsers(database);
      return updatedUser;
    } else {
      // Create new user
      const newUser: UserData = {
        id: `user_${Date.now()}`,
        email: userData.email,
        name: userData.name || '',
        picture: userData.picture || '',
        createdAt: now,
        lastLogin: now,
        items: userData.items || [],
        favoriteItems: userData.favoriteItems || [],
        exchangeRequests: userData.exchangeRequests || [],
      };
      database.users.push(newUser);
      this.saveUsers(database);
      return newUser;
    }
  }

  // Add item to user
  static addItemToUser(userEmail: string, item: Item): void {
    const database = this.loadUsers();
    const userIndex = database.users.findIndex(user => user.email === userEmail);
    
    if (userIndex >= 0) {
      database.users[userIndex].items.push(item);
      this.saveUsers(database);
      console.log(`Item ${item.id} added to user ${userEmail}. User now has ${database.users[userIndex].items.length} items.`);
    } else {
      console.error(`User ${userEmail} not found in database. Cannot add item.`);
      // Create user if they don't exist
      this.saveUser({ email: userEmail, name: 'Unknown User', items: [item] });
      console.log(`Created new user ${userEmail} and added item.`);
    }
  }

  // Update item for user
  static updateUserItem(userEmail: string, itemId: string, updates: Partial<Item>): void {
    const database = this.loadUsers();
    const userIndex = database.users.findIndex(user => user.email === userEmail);
    
    if (userIndex >= 0) {
      const itemIndex = database.users[userIndex].items.findIndex(item => item.id === itemId);
      if (itemIndex >= 0) {
        database.users[userIndex].items[itemIndex] = {
          ...database.users[userIndex].items[itemIndex],
          ...updates
        };
        this.saveUsers(database);
      }
    }
  }

  // Add/remove favorite item
  static toggleFavorite(userEmail: string, itemId: string): void {
    const database = this.loadUsers();
    const userIndex = database.users.findIndex(user => user.email === userEmail);
    
    if (userIndex >= 0) {
      const favoriteIndex = database.users[userIndex].favoriteItems.indexOf(itemId);
      if (favoriteIndex >= 0) {
        database.users[userIndex].favoriteItems.splice(favoriteIndex, 1);
      } else {
        database.users[userIndex].favoriteItems.push(itemId);
      }
      this.saveUsers(database);
    }
  }

  // Add exchange request
  static addExchangeRequest(request: ExchangeRequest): void {
    const database = this.loadUsers();
    
    // Add to both requester and target owner
    const requesterIndex = database.users.findIndex(user => user.email === request.requesterId);
    const targetOwnerIndex = database.users.findIndex(user => user.email === request.targetOwnerId);
    
    if (requesterIndex >= 0) {
      database.users[requesterIndex].exchangeRequests.push(request);
    }
    
    if (targetOwnerIndex >= 0 && targetOwnerIndex !== requesterIndex) {
      database.users[targetOwnerIndex].exchangeRequests.push(request);
    }
    
    this.saveUsers(database);
  }

  // Update exchange request status
  static updateExchangeRequest(requestId: string, status: 'accepted' | 'rejected'): void {
    const database = this.loadUsers();
    const now = new Date().toISOString();
    
    database.users.forEach(user => {
      const requestIndex = user.exchangeRequests.findIndex(req => req.id === requestId);
      if (requestIndex >= 0) {
        user.exchangeRequests[requestIndex].status = status;
        user.exchangeRequests[requestIndex].updatedAt = now;
      }
    });
    
    this.saveUsers(database);
  }

  // Get all items from all users (for public marketplace)
  static getAllItems(): Item[] {
    const database = this.loadUsers();
    const allItems: Item[] = [];
    
    database.users.forEach(user => {
      allItems.push(...user.items);
    });
    
    return allItems;
  }

  // Get exchange requests for a user
  static getExchangeRequestsForUser(userEmail: string): ExchangeRequest[] {
    const user = this.getUser(userEmail);
    return user ? user.exchangeRequests : [];
  }

  // Initialize with sample data if no data exists
  static initializeWithSampleData(): void {
    const existing = this.loadUsers();
    if (existing.users.length === 0) {
      const sampleData: UserDatabase = {
        users: [
          {
            id: "user_sample",
            email: "sample@university.edu",
            name: "Sample User",
            picture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=60",
            createdAt: "2025-10-10T00:00:00.000Z",
            lastLogin: "2025-10-10T00:00:00.000Z",
            items: [
              {
                id: "sample_item_1",
                title: "Sample MacBook Pro 13-inch 2020",
                location: "North Campus",
                timePosted: "2025-10-10T00:00:00.000Z",
                category: "electronics",
                condition: "excellent",
                images: [
                  "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop&auto=format&q=60"
                ],
                description: "Sample MacBook in excellent condition for exchange",
                seller: {
                  name: "Sample User",
                  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=60",
                  rating: 4.8
                },
                isFavorited: false,
                status: 'available' as const,
                ownerId: "sample@university.edu"
              }
            ],
            favoriteItems: [],
            exchangeRequests: []
          }
        ],
        lastUpdated: "2025-10-10T00:00:00.000Z"
      };
      this.saveUsers(sampleData);
    }
  }

  // Remove item from all users' favorite lists (used when item is deleted)
  static removeItemFromAllFavorites(itemId: string): void {
    const database = this.loadUsers();
    let hasChanges = false;

    database.users.forEach(user => {
      const initialLength = user.favoriteItems.length;
      user.favoriteItems = user.favoriteItems.filter(favId => favId !== itemId);
      if (user.favoriteItems.length !== initialLength) {
        hasChanges = true;
      }
    });

    if (hasChanges) {
      database.lastUpdated = new Date().toISOString();
      this.saveUsers(database);
    }
  }

  // Remove all exchange requests involving a deleted item
  static removeExchangeRequestsForItem(itemId: string): void {
    const database = this.loadUsers();
    let hasChanges = false;

    database.users.forEach(user => {
      const initialLength = user.exchangeRequests.length;
      // Remove requests where the deleted item is the target or offered item
      user.exchangeRequests = user.exchangeRequests.filter(request => 
        request.targetItemId !== itemId && 
        !request.offeredItemIds.includes(itemId)
      );
      if (user.exchangeRequests.length !== initialLength) {
        hasChanges = true;
      }
    });

    if (hasChanges) {
      database.lastUpdated = new Date().toISOString();
      this.saveUsers(database);
    }
  }

  // Clear all data (for testing)
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Get the timestamp of last database update
  static getLastUpdateTime(): string {
    const database = this.loadUsers();
    return database.lastUpdated;
  }

  // Check if database has been updated since last check
  static hasDataChanged(lastKnownUpdate: string): boolean {
    const currentUpdate = this.getLastUpdateTime();
    return currentUpdate !== lastKnownUpdate;
  }
}