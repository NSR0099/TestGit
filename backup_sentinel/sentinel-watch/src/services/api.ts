import { Incident, DashboardStats, ActivityLog, Notification, IncidentStatus, IncidentSeverity } from '@/types/emergency';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new ApiError(response.status, `API Error: ${response.statusText}`);
    }
    return response.json();
}

export const api = {
    login: async (email: string, password: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return handleResponse(response);
    },

    // Incidents
    getIncidents: async (): Promise<Incident[]> => {
        const response = await fetch(`${API_BASE_URL}/incidents`);
        return handleResponse<Incident[]>(response);
    },

    getIncident: async (id: string): Promise<Incident> => {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}`);
        return handleResponse<Incident>(response);
    },

    updateIncidentStatus: async (id: string, status: IncidentStatus): Promise<Incident> => {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        return handleResponse<Incident>(response);
    },

    updateIncidentSeverity: async (id: string, severity: IncidentSeverity): Promise<Incident> => {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}/severity`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ severity }),
        });
        return handleResponse<Incident>(response);
    },

    updateIncidentDepartment: async (id: string, department: string): Promise<Incident> => {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}/department`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department }),
        });
        return handleResponse<Incident>(response);
    },

    verifyIncident: async (id: string): Promise<Incident> => {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}/verify`, {
            method: 'POST',
        });
        return handleResponse<Incident>(response);
    },

    markAsFalse: async (id: string, reason: string): Promise<Incident> => {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}/false`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
        });
        return handleResponse<Incident>(response);
    },

    markAsDuplicate: async (id: string, originalId: string): Promise<Incident> => {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}/duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ originalId }),
        });
        return handleResponse<Incident>(response);
    },

    addAdminNote: async (id: string, content: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/incidents/${id}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        return handleResponse(response);
    },

    getNotes: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/notes`);
        return handleResponse<any[]>(response);
    },

    // Stats
    getStats: async (): Promise<DashboardStats> => {
        const response = await fetch(`${API_BASE_URL}/stats`);
        return handleResponse<DashboardStats>(response);
    },

    // Activity Logs
    getActivityLogs: async (): Promise<ActivityLog[]> => {
        const response = await fetch(`${API_BASE_URL}/activity-logs`);
        return handleResponse<ActivityLog[]>(response);
    },

    // Notifications
    getNotifications: async (): Promise<Notification[]> => {
        const response = await fetch(`${API_BASE_URL}/notifications`);
        return handleResponse<Notification[]>(response);
    },

    markNotificationRead: async (id: string): Promise<void> => {
        await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'POST',
        });
    },
};
