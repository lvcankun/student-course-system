import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Notification } from '@/types';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  notifications: Notification[];
  unreadCount: number;
  loginAttempts: number;
  lockedUntil: number | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateCredits: (selectedCredits: number) => void;
  updateProfile: (profile: Partial<User>) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addLoginAttempt: () => void;
  resetLoginAttempts: () => void;
  isLocked: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      notifications: [],
      unreadCount: 0,
      loginAttempts: 0,
      lockedUntil: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token });
      },

      login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.removeItem('user-storage');
        console.log('User logged in:', user);
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          loginAttempts: 0,
          lockedUntil: null,
          notifications: [],
          unreadCount: 0,
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user-storage');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          notifications: [],
          unreadCount: 0,
          loginAttempts: 0,
          lockedUntil: null,
        });
      },

      updateCredits: (selectedCredits) =>
        set((state) => ({
          user: state.user ? { ...state.user, selectedCredits } : null,
        })),

      updateProfile: (profile) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : null,
        })),

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        set({ notifications, unreadCount });
      },

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      addLoginAttempt: () => {
        const { loginAttempts } = get();
        const newAttempts = loginAttempts + 1;
        if (newAttempts >= 5) {
          const lockedUntil = Date.now() + 30 * 60 * 1000;
          set({ loginAttempts: newAttempts, lockedUntil });
        } else {
          set({ loginAttempts: newAttempts });
        }
      },

      resetLoginAttempts: () => set({ loginAttempts: 0, lockedUntil: null }),

      isLocked: () => {
        const { lockedUntil } = get();
        if (lockedUntil && Date.now() < lockedUntil) {
          return true;
        }
        if (lockedUntil && Date.now() >= lockedUntil) {
          set({ loginAttempts: 0, lockedUntil: null });
        }
        return false;
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loginAttempts: state.loginAttempts,
        lockedUntil: state.lockedUntil,
      }),
    }
  )
);
