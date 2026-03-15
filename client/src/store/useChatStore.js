import { create } from 'zustand';

// Ephemeral UI state for the chat interface
export const useChatStore = create((set) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  // Map of userId -> boolean typing status
  typingUsers: {},
  setTypingUser: (userId, isTyping) => 
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: isTyping
      }
    })),
  clearTypingUser: (userId) =>
    set((state) => {
      const next = { ...state.typingUsers };
      delete next[userId];
      return { typingUsers: next };
    }),
}));
