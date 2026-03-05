import { users } from '@/data/mock';
import type { User } from '@/types';

// In a real application, this would be an API client making HTTP requests
export const userService = {
  getAll: (): User[] => {
    return users;
  },

  getById: (id: string): User | undefined => {
    return users.find(user => user.id === id);
  },

  getByRole: (role: string): User[] => {
    return users.filter(user => user.role === role);
  },
};
