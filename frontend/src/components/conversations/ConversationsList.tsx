// src/components/conversations/ConversationsList.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Conversation } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
}) => {
  const navigate = useNavigate();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

   const handleNavigation = (conversation: Conversation) => {
    if (window.innerWidth < 768) {
      // Mobile view
      navigate(`/conversation/${conversation.id}`);
    } else {
        onSelectConversation(conversation);
    }
  };

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon="💬"
        title="No conversations"
        description="Your conversations will appear here once you start chatting."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Conversations ({conversations.length})
        </h3>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => handleNavigation(conversation)}
            className={`block cursor-pointer transition-colors hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
              selectedConversation?.id === conversation.id
                ? 'bg-blue-50 border-r-2 border-blue-500'
                : 'bg-white'
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 text-sm leading-tight pr-2">
                  {conversation.title}
                </h4>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(conversation.start_time)}
                </span>
              </div>

              {/* Preview */}
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {conversation.summary || conversation.last_message || 'No messages yet'}
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-1 mb-2">
                {conversation.sentiment && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                      conversation.sentiment
                    )}`}
                  >
                    {conversation.sentiment}
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {conversation.message_count || 0} messages
                </span>
              </div>

              {/* Key Topics */}
              {conversation.key_topics && conversation.key_topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {conversation.key_topics.slice(0, 3).map((topic, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {topic}
                    </span>
                  ))}
                  {conversation.key_topics.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      +{conversation.key_topics.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="flex justify-between items-center mt-2">
                <span
                  className={`inline-flex items-center text-xs font-medium ${
                    conversation.status === 'active'
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-1 ${
                      conversation.status === 'active'
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-gray-400'
                    }`}
                  ></span>
                  {conversation.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};