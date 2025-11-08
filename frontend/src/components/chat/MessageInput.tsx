// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  loading = false,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !loading) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message AI..."
          disabled={disabled || loading}
          rows={1}
          className="w-full px-4 py-3 pr-12 resize-none border-0 focus:ring-0 focus:outline-none rounded-2xl bg-transparent placeholder-gray-500 text-gray-900"
        />
        
        <div className="absolute right-2 bottom-2">
          <Button
            type="submit"
            disabled={!message.trim() || disabled || loading}
            loading={loading}
            size="sm"
            className="rounded-lg px-3 py-2 min-w-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};