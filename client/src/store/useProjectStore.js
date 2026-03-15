import { create } from 'zustand';

// Ephemeral UI state for the project workspace / kanban board
export const useProjectStore = create((set) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Kanban drag state (optimization: keeps drag state out of React Context to prevent re-renders)
  draggedTaskId: null,
  setDraggedTaskId: (id) => set({ draggedTaskId: id }),
  
  dragOverColumnId: null,
  setDragOverColumnId: (id) => set({ dragOverColumnId: id }),
}));
