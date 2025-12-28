import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Incident, IncidentStatus, IncidentSeverity, ActivityLog, Notification, DashboardStats, AdminNote } from '@/types/emergency';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { fixDates } from '@/lib/utils';

interface EmergencyContextType {
  incidents: Incident[];
  selectedIncident: Incident | null;
  activityLogs: ActivityLog[];
  notifications: Notification[];
  adminNotes: AdminNote[];
  dashboardStats: DashboardStats;
  isLiveUpdates: boolean;
  isSystemOnline: boolean;
  setSelectedIncident: (incident: Incident | null) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus) => void;
  updateIncidentSeverity: (id: string, severity: IncidentSeverity) => void;
  updateIncidentDepartment: (id: string, department: string) => void;
  verifyIncident: (id: string) => void;
  markAsFalse: (id: string, reason: string) => void;
  markAsDuplicate: (id: string, originalId: string) => void;
  addAdminNote: (incidentId: string, content: string) => void;
  toggleLiveUpdates: () => void;
  markNotificationRead: (id: string) => void;
  getUnreadNotificationCount: () => number;
  refreshData: () => void;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]); // Notes might need its own endpoint or come with incident
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalActive: 0,
    unverified: 0,
    verifiedInProgress: 0,
    resolvedToday: 0,
  });
  const [isLiveUpdates, setIsLiveUpdates] = useState(true);
  const [isSystemOnline, setIsSystemOnline] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [fetchedIncidents, fetchedStats, fetchedLogs, fetchedNotifications, fetchedNotes] = await Promise.all([
        api.getIncidents(),
        api.getStats(),
        api.getActivityLogs(),
        api.getNotifications(),
        api.getNotes(),
      ]);

      // Helper to fix dates

      const fixDates = (obj: any): any => {
        if (!obj) return obj;
        if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) return new Date(obj);
        if (Array.isArray(obj)) return obj.map(fixDates);
        if (typeof obj === 'object') {
          Object.keys(obj).forEach(k => obj[k] = fixDates(obj[k]));
        }
        return obj;
      };

      setIncidents(fixDates(fetchedIncidents));
      setDashboardStats(fetchedStats);
      setActivityLogs(fixDates(fetchedLogs));
      setNotifications(fixDates(fetchedNotifications));
      setAdminNotes(fixDates(fetchedNotes));

      setIsSystemOnline(true);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setIsSystemOnline(false);
      toast.error("Connection Error", { description: "Failed to connect to the emergency server." });
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Simulate real-time updates (polling)
  useEffect(() => {
    if (!isLiveUpdates) return;

    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, [isLiveUpdates, fetchData]);

  const updateIncidentStatus = useCallback(async (id: string, status: IncidentStatus) => {
    try {
      const updated = await api.updateIncidentStatus(id, status);
      const fixed = fixDates(updated);
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...fixed } : inc));
      await fetchData(); // Refresh all to get correct stats/logs
      toast.success(`Status updated to ${status}`);
    } catch (e) {
      toast.error("Failed to update status");
    }
  }, [fetchData]);

  const updateIncidentSeverity = useCallback(async (id: string, severity: IncidentSeverity) => {
    try {
      const updated = await api.updateIncidentSeverity(id, severity);
      const fixed = fixDates(updated);
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...fixed } : inc));
      await fetchData();
      toast.success(`Severity updated to ${severity}`);
    } catch (e) {
      toast.error("Failed to update severity");
    }
  }, [fetchData]);

  const updateIncidentDepartment = useCallback(async (id: string, department: string) => {
    try {
      const updated = await api.updateIncidentDepartment(id, department);
      const fixed = fixDates(updated);
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...fixed } : inc));
      await fetchData();
      toast.success(`Department updated`);
    } catch (e) {
      toast.error("Failed to update department");
    }
  }, [fetchData]);

  const verifyIncident = useCallback(async (id: string) => {
    try {
      const updated = await api.verifyIncident(id);
      const fixed = fixDates(updated);
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...fixed } : inc));
      await fetchData();
      toast.success("Incident verified");
    } catch (e) {
      toast.error("Failed to verify incident");
    }
  }, [fetchData]);

  const markAsFalse = useCallback(async (id: string, reason: string) => {
    try {
      const updated = await api.markAsFalse(id, reason);
      const fixed = fixDates(updated);
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...fixed } : inc));
      await fetchData();
      toast.success("Marked as false report");
    } catch (e) {
      toast.error("Failed to mark as false");
    }
  }, [fetchData]);

  const markAsDuplicate = useCallback(async (id: string, originalId: string) => {
    try {
      const updated = await api.markAsDuplicate(id, originalId);
      const fixed = fixDates(updated);
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...fixed } : inc));
      await fetchData();
      toast.success("Marked as duplicate");
    } catch (e) {
      toast.error("Failed to mark as duplicate");
    }
  }, [fetchData]);

  const addAdminNote = useCallback(async (incidentId: string, content: string) => {
    try {
      const newNote = await api.addAdminNote(incidentId, content);
      setAdminNotes(prev => [fixDates(newNote), ...prev]);
      toast.success("Note added");
    } catch (e) {
      toast.error("Failed to add note");
    }
  }, []);

  const toggleLiveUpdates = useCallback(() => {
    setIsLiveUpdates(prev => !prev);
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error("Failed to mark read notification");
    }
  }, []);

  const getUnreadNotificationCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Update selected incident when incidents change, but only if content differs
  useEffect(() => {
    if (selectedIncident) {
      const updated = incidents.find(i => i.id === selectedIncident.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedIncident)) {
        setSelectedIncident(updated);
      }
    }
  }, [incidents, selectedIncident]);

  return (
    <EmergencyContext.Provider value={{
      incidents,
      selectedIncident,
      activityLogs,
      notifications,
      adminNotes,
      dashboardStats,
      isLiveUpdates,
      isSystemOnline,
      setSelectedIncident,
      updateIncidentStatus,
      updateIncidentSeverity,
      updateIncidentDepartment,
      verifyIncident,
      markAsFalse,
      markAsDuplicate,
      addAdminNote,
      toggleLiveUpdates,
      markNotificationRead,
      getUnreadNotificationCount,
      refreshData,
    }}>
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
