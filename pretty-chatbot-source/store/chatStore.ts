import { create } from 'zustand';
import { IChatMessage, IChatState } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatStore extends IChatState {
  addMessage: (content: string, role: 'user' | 'assistant') => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set: any) => ({
  messages: [],
  isLoading: false,
  
  addMessage: (content: string, role: 'user' | 'assistant') => 
    set((state: any) => ({
      messages: [
        ...state.messages,
        {
          id: uuidv4(),
          role,
          content,
          timestamp: new Date(),
        },
      ],
    })),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  clearMessages: () => set({ messages: [] }),
}));