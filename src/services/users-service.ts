import { apiClient } from './api-client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Away' | 'Inactive';
  lastActive: string;
}

export const UsersService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<User[]>('/users');
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  addUser: async (user: Omit<User, 'id' | 'lastActive' | 'status'>): Promise<User> => {
    try {
      const response = await apiClient.post<User>('/users', user);
      return response;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },

  updateUserStatus: async (userId: string, status: User['status']): Promise<User> => {
    try {
      const response = await apiClient.put<User>(`/users/${userId}/status`, { status });
      return response;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};