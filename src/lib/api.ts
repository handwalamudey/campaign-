import { Voter, PollingStation } from '@/types/campaign';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = 'https://back-production-30ef.up.railway.app/api';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    return headers;
};

// For multipart/form-data uploads we don't set Content-Type manually
const getUploadHeaders = () => {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    return headers;
};

export const api = {
    async login(credentials: any) {
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Login failed' }));
            throw new Error(error.detail || JSON.stringify(error) || 'Login failed');
        }
        return response.json();
    },

    async getVoters(): Promise<Voter[]> {
        const response = await fetch(`${API_BASE_URL}/voters/`, {
            headers: getHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch voters');
        }
        const data = await response.json();
        // Handle DRF pagination (returns { results: [...] }) or direct array
        return Array.isArray(data) ? data : (data.results || []);
    },

    async createVoter(voter: Omit<Voter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Voter> {
        const response = await fetch(`${API_BASE_URL}/voters/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(voter),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.idNumber?.[0] || errorData.detail || 'Failed to create voter';
            throw new Error(message);
        }
        return response.json();
    },
    
    async updateVoter(id: string, voter: Partial<Voter>): Promise<Voter> {
        const response = await fetch(`${API_BASE_URL}/voters/${id}/`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(voter),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.idNumber?.[0] || errorData.detail || 'Failed to update voter';
            throw new Error(message);
        }
        return response.json();
    },

    async deleteVoter(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/voters/${id}/`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to delete voter');
        }
    },

    async deleteAllVoters(): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/voters/delete_all/`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to delete all voters');
        }
    },

    async getStations(): Promise<PollingStation[]> {
        const response = await fetch(`${API_BASE_URL}/stations/`, {
            headers: getHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch stations');
        }
        const data = await response.json();
        // Handle DRF pagination (returns { results: [...] }) or direct array
        return Array.isArray(data) ? data : (data.results || []);
    },

    async createStation(station: Omit<PollingStation, 'id'>): Promise<PollingStation> {
        const response = await fetch(`${API_BASE_URL}/stations/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(station),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to create station');
        }
        return response.json();
    },

    async deleteStation(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/stations/${id}/`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to delete station');
        }
    },

    async sendMessage(payload: {
        voter_id?: string;
        voter_ids?: string[];
        channel: 'sms' | 'whatsapp';
        content: string;
        template_name?: string;
    }) {
        const response = await fetch(`${API_BASE_URL}/messages/send/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to send message');
        }
        return response.json();
    },

    async getMessageHistory(voterId: string) {
        const response = await fetch(`${API_BASE_URL}/voters/${voterId}/message_history/`, {
            headers: getHeaders(),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch message history');
        }
        return response.json();
    },

    async bulkUploadVoters(file: File): Promise<{ created: number; errors: string[] }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/voters/bulk_upload/`, {
            method: 'POST',
            headers: getUploadHeaders(),
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || 'Failed to bulk upload voters');
        }

        return response.json();
    },
};
