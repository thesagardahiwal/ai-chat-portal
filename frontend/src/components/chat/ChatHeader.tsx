// src/components/chat/ChatHeader.tsx
import React from 'react';
import type { Conversation } from '../../types';
import { Button } from '../common/Button';

interface ChatHeaderProps {
  conversation: Conversation | null;
  onEndConversation: () => void;
  onNewConversation: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onEndConversation,
  onNewConversation,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {conversation?.title || 'New Conversation'}
          </h1>
          {conversation && (
            <p className="text-sm text-gray-500">
              {conversation.status === 'active' ? 'Active now' : 'Conversation ended'}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {conversation && conversation.status === 'active' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onEndConversation}
            className="text-gray-600 flex items-center justify-center gap-2 hover:text-gray-800"
          >
            End Chat
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          className='flex items-center justify-center gap-2'
          onClick={onNewConversation}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Chat
        </Button>
      </div>
    </div>
  );
};