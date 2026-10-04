'use client'

import React, { useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import Message from './Message';
import ChatInput from './ChatInput';
import AdminReporter from './AdminReporter';

export default function Chat() {
  const { state } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Pretty Chatbot</h1>
            <p className="text-sm text-gray-600">A beautiful chatbot that echoes your messages</p>
          </div>
          <AdminReporter />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* Chat background pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), 
                               radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), 
                               radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)`
            }}></div>
          </div>
          
          {/* Chat messages container with enhanced background */}
          <div className="relative bg-white/40 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 min-h-[60vh]">
            {state.messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {state.isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white/70 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg shadow-md border border-white/30">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input area */}
      <ChatInput />
    </div>
  );
}