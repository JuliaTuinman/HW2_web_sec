'use client';

import { useState } from 'react';

export default function AdminReporter() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const getCurrentUrl = () => {
    return window.location.href;
  };

  const handleShareToAdmin = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const currentUrl = getCurrentUrl();
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: currentUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Admin will visit this page shortly!');
        setMessageType('success');
      } else {
        setMessage(data.error || 'Failed to share with admin');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error occurred');
      setMessageType('error');
    } finally {
      setIsLoading(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div>
      <button
        onClick={handleShareToAdmin}
        disabled={isLoading}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        {isLoading ? 'Sharing...' : 'Share to Admin'}
      </button>

      {message && (
        <div className={`fixed bottom-16 right-4 p-3 rounded-lg shadow-lg ${
          messageType === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}