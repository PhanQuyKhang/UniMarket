import { Item } from '../components/ItemCard';

export interface UserData {
  id: string;
  email: string;
  name: string;
  picture: string;
  createdAt: string;
  lastLogin: string;
  items: Item[];
  exchangeRequests: ExchangeRequest[];
  phone?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  isAdmin?: boolean;
}

export interface ExchangeRequest {
  id: string;
  targetItemId: string;
  offeredItemIds: string[];
  requesterId: string;
  requesterName: string;
  targetOwnerId: string;
  // extended statuses (added completed & cancelled)
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  // both parties must confirm to fully complete the exchange
  requesterConfirmed?: boolean;
  ownerConfirmed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDatabase {
  users: UserData[];
  lastUpdated: string;
  reports?: Report[]; // global reports
}

export interface Report {
  id: string;
  reporterId: string;
  targetUserId?: string;
  targetItemId?: string;
  reason: string;
  createdAt: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
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
      lastUpdated: new Date().toISOString(),
      reports: []
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
        exchangeRequests: userData.exchangeRequests || [],
        isAdmin: !!userData['isAdmin'],
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


  // Add exchange request
  static addExchangeRequest(request: ExchangeRequest): void {
    const database = this.loadUsers();
    
    // Add to both requester and target owner
    const requesterIndex = database.users.findIndex(user => user.email === request.requesterId);
    const targetOwnerIndex = database.users.findIndex(user => user.email === request.targetOwnerId);
    
    // Initialize confirmation flags for new request
    const requestWithFlags: ExchangeRequest = {
      ...request,
      requesterConfirmed: false,
      ownerConfirmed: false,
    };

    if (requesterIndex >= 0) {
      database.users[requesterIndex].exchangeRequests.push(requestWithFlags);
    }
    
    if (targetOwnerIndex >= 0 && targetOwnerIndex !== requesterIndex) {
      database.users[targetOwnerIndex].exchangeRequests.push(requestWithFlags);
    }
    
    this.saveUsers(database);
  }

  // Update exchange request status (now supports more statuses)
  static updateExchangeRequest(requestId: string, status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'): void {
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

  // Confirm exchange completion from a user (returns true if both confirmed)
  static confirmExchangeCompletion(requestId: string, confirmingUserEmail: string): boolean {
    const database = this.loadUsers();
    const now = new Date().toISOString();
    let bothConfirmed = false;

    // Update flags across all user copies in the in-memory database
    database.users.forEach(user => {
      const requestIndex = user.exchangeRequests.findIndex(req => req.id === requestId);
      if (requestIndex >= 0) {
        const req = user.exchangeRequests[requestIndex];
        database.users.forEach(u => {
          const idx = u.exchangeRequests.findIndex(r => r.id === requestId);
          if (idx >= 0) {
            if (confirmingUserEmail === req.requesterId) {
              u.exchangeRequests[idx].requesterConfirmed = true;
            } else if (confirmingUserEmail === req.targetOwnerId) {
              u.exchangeRequests[idx].ownerConfirmed = true;
            }
            u.exchangeRequests[idx].updatedAt = now;
          }
        });
      }
    });

    // Determine bothConfirmed from the updated in-memory database (avoid reloading from storage)
    for (const u of database.users) {
      const req = u.exchangeRequests.find(r => r.id === requestId);
      if (req && req.requesterConfirmed && req.ownerConfirmed) {
        bothConfirmed = true;
        break;
      }
    }

    // Persist changes before returning
    this.saveUsers(database);
    return bothConfirmed;
  }

  // Helper to collect all requests (merge copies)
  private static getAllRequests(): ExchangeRequest[] {
    const database = this.loadUsers();
    const ids = new Set<string>();
    const merged: ExchangeRequest[] = [];
    database.users.forEach(user => {
      user.exchangeRequests.forEach(req => {
        if (!ids.has(req.id)) {
          ids.add(req.id);
          merged.push(req);
        }
      });
    });
    return merged;
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

  // Admin / Reporting helpers
  static addReport(report: Omit<Report, 'id' | 'createdAt' | 'resolved'>): Report {
    const db = this.loadUsers();
    const r: Report = {
      id: `report_${Date.now()}`,
      ...report,
      createdAt: new Date().toISOString(),
      resolved: false
    };
    db.reports = db.reports || [];
    db.reports.push(r);
    this.saveUsers(db);
    return r;
  }

  static getReports(): Report[] {
    const db = this.loadUsers();
    return db.reports || [];
  }

  static resolveReport(reportId: string, adminEmail: string): void {
    const db = this.loadUsers();
    db.reports = db.reports || [];
    const idx = db.reports.findIndex(r => r.id === reportId);
    if (idx >= 0) {
      db.reports[idx].resolved = true;
      db.reports[idx].resolvedBy = adminEmail;
      db.reports[idx].resolvedAt = new Date().toISOString();
      this.saveUsers(db);
    }
  }

  static deleteUser(userEmail: string): void {
    const db = this.loadUsers();
    db.users = db.users.filter(u => u.email !== userEmail);
    // Also remove user's items and any exchange requests referencing them
    db.users.forEach(u => {
      u.exchangeRequests = u.exchangeRequests.filter(r => r.requesterId !== userEmail && r.targetOwnerId !== userEmail);
    });
    db.reports = (db.reports || []).filter(r => r.reporterId !== userEmail && r.targetUserId !== userEmail);
    this.saveUsers(db);
  }

  static deleteItem(itemId: string): void {
    const db = this.loadUsers();
    db.users.forEach(u => {
      u.items = u.items.filter(i => i.id !== itemId);
      u.exchangeRequests = u.exchangeRequests.filter(r => r.targetItemId !== itemId && !r.offeredItemIds.includes(itemId));
    });
    db.reports = (db.reports || []).filter(r => r.targetItemId !== itemId);
    this.saveUsers(db);
  }

  static setAdmin(userEmail: string, isAdmin: boolean): void {
    const db = this.loadUsers();
    const idx = db.users.findIndex(u => u.email === userEmail);
    if (idx >= 0) {
      db.users[idx].isAdmin = isAdmin;
      this.saveUsers(db);
    }
  }
}