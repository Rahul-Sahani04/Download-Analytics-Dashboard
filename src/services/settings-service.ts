import { apiClient } from './api-client';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export interface UserSettings {
  // Profile settings
  name: string;
  email: string;
  role: string;
  department?: string;
  
  // Preferences
  analyticsEnabled: boolean;
  autoDownloadEnabled: boolean;
  
  // Notification settings
  emailNotifications: boolean;
  activityUpdates: boolean;
  newResourceAlerts: boolean;
  
  // Privacy settings
  publicProfile: boolean;
  activityVisible: boolean;
  dataRetention: '3months' | '6months' | '1year' | 'forever';
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  department?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateSettingsRequest {
  preferences?: {
    analyticsEnabled?: boolean;
    autoDownloadEnabled?: boolean;
  };
  notifications?: {
    emailNotifications?: boolean;
    activityUpdates?: boolean;
    newResourceAlerts?: boolean;
  };
  privacy?: {
    publicProfile?: boolean;
    activityVisible?: boolean;
    dataRetention?: string;
  };
}

export const settingsService = {
  getUserSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get<{ data: UserSettings }>('/settings');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<void> => {
    await apiClient.put('/settings/profile', data);
  },

  updateSettings: async (data: UpdateSettingsRequest): Promise<void> => {
    await apiClient.put('/settings', data);
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/settings/password', {
      currentPassword,
      newPassword
    });
  }
};

export default settingsService;