'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { IChatMessage, IChatState } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
  state: IChatState;
  sendMessage: (content: string) => void;
  sendInitialMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction = 
  | { type: 'ADD_MESSAGE'; payload: IChatMessage }
  | { type: 'SET_LOADING'; payload: boolean };

const chatReducer = (state: IChatState, action: ChatAction): IChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const initialState: IChatState = {
  messages: [
    {
      id: 'initial-message',
      content: '🌟 **Welcome to Pretty Chatbot!** 🌟\n\nI\'m here to have a conversation with you. I\'ll echo back your messages and support rich content like:\n\n- ✨ **Markdown formatting**\n- 📊 Interactive charts\n- 🎨 Beautiful styling\n\n*Feel free to try me out!* 💬',
      role: 'assistant',
      timestamp: new Date('2025-01-01T00:00:00.000Z'),
    }
  ],
  isLoading: false,
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const sendInitialMessage = (content: string) => {
    // Add user message
    const userMessage: IChatMessage = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });

    // Simulate bot response (echo back)
    setTimeout(() => {
      const botMessage: IChatMessage = {
        id: uuidv4(),
        content: content, // Echo back the user's message
        role: 'assistant',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: botMessage });
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 500);
  };

  // Check for URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const initialMessage = urlParams.get('message');
      
      if (initialMessage) {
        // Decode the message and send it automatically
        try {
          const decodedMessage = decodeURIComponent(initialMessage);
          sendInitialMessage(decodedMessage);
        } catch (error) {
          console.error('Failed to decode URL message parameter:', error);
        }
      }
    }
  }, []);

  const sendMessage = (content: string) => {
    // Add user message
    const userMessage: IChatMessage = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });

    // Simulate bot response (echo back)
    setTimeout(() => {
      const botMessage: IChatMessage = {
        id: uuidv4(),
        content: content, // Echo back the user's message
        role: 'assistant',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: botMessage });
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 500);
  };

  return (
    <ChatContext.Provider value={{ state, sendMessage, sendInitialMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};