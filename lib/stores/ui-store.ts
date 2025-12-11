'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  activeInstanceId: string | null;
  activeConversationId: string | null;
  chatSearchQuery: string;
  contactSearchQuery: string;
  toggleSidebarCollapsed: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveInstanceId: (id: string | null) => void;
  setActiveConversationId: (id: string | null) => void;
  setChatSearchQuery: (query: string) => void;
  setContactSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      activeInstanceId: null,
      activeConversationId: null,
      chatSearchQuery: '',
      contactSearchQuery: '',
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveInstanceId: (id) => set({ activeInstanceId: id }),
      setActiveConversationId: (id) => set({ activeConversationId: id }),
      setChatSearchQuery: (query) => set({ chatSearchQuery: query }),
      setContactSearchQuery: (query) => set({ contactSearchQuery: query }),
    }),
    {
      name: 'whatsappx-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeInstanceId: state.activeInstanceId,
      }),
    }
  )
);