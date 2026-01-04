import { Item } from '../components/ItemCard';
import { ExchangeRequest } from '../data/userDataService';

const API_URL = import.meta.env.VITE_API_URL || 'https://unimarkettest.onrender.com/api';

export const api = {
    // Items
    getItems: async (): Promise<Item[]> => {
        const response = await fetch(`${API_URL}/items`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch items');
        return response.json();
    },

    getItem: async (id: string): Promise<Item> => {
        const response = await fetch(`${API_URL}/items/${id}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch item');
        return response.json();
    },

    createItem: async (itemData: any): Promise<Item> => {
        const isFormData = itemData instanceof FormData;
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
        const body = isFormData ? itemData : JSON.stringify(itemData);

        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: body,
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to create item');
        return response.json();
    },

    updateItem: async (id: string, itemData: any): Promise<Item> => {
        const isFormData = itemData instanceof FormData;
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
        const body = isFormData ? itemData : JSON.stringify(itemData);

        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'PUT',
            headers: headers as HeadersInit,
            body: body,
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to update item');
        return response.json();
    },

    deleteItem: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'DELETE',
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to delete item');
    },

    // Users
    login: async (userData: { email: string; name: string; picture: string }): Promise<any> => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to login');
        return response.json();
    },

    getUser: async (userId: string): Promise<any> => {
        const response = await fetch(`${API_URL}/users/${userId}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
    },

    getUserByEmail: async (email: string): Promise<any> => {
        const response = await fetch(`${API_URL}/users/email/${email}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
    },

    getUserItems: async (userId: string): Promise<Item[]> => {
        const response = await fetch(`${API_URL}/users/${userId}/items`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch user items');
        return response.json();
    },

    deleteUser: async (userId: string): Promise<void> => {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to delete user');
    },

    getAllUsers: async (): Promise<any[]> => {
        const response = await fetch(`${API_URL}/users`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    // Exchange Requests
    getExchangeRequests: async (userId: string): Promise<ExchangeRequest[]> => {
        const response = await fetch(`${API_URL}/users/${userId}/exchange-requests`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch exchange requests');
        return response.json();
    },

    createExchangeRequest: async (requestData: any): Promise<ExchangeRequest> => {
        const response = await fetch(`${API_URL}/exchange-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to create exchange request');
        return response.json();
    },

    updateExchangeRequestStatus: async (requestId: string, status: string, userId?: string): Promise<ExchangeRequest> => {
        const response = await fetch(`${API_URL}/exchange-requests/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, userId }),
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to update exchange request');
        return response.json();
    },
};
