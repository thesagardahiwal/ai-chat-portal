// src/components/conversations/ConversationDetail.tsx
import React, { useEffect } from 'react';
import type { Conversation } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { apiService } from '../../services/api';
import { MessageBubble } from '../chat/MessageBubble';

interface ConversationDetailProps {
  conversation: Conversation | null;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversation,
}) => {
  const [currentConversation, setCurrentConversation] = React.useState<Conversation | null>(conversation);
  const retrieveConversation = async (id: number) => {
    // Placeholder for actual retrieval logic
    try {
        const response = await apiService.getConversation(id);
        if (response) {
            setCurrentConversation({...conversation, ...response});
        };
    } catch (error) {
        console.error('Error retrievin full information of this conversation:', error);
    }
  }
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

   useEffect(() => {
    if (conversation) {
        retrieveConversation(conversation.id);
    };
  }, [conversation]);

  if (!currentConversation) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
        <EmptyState
          icon="📖"
          title="Select a conversation"
          description="Choose a conversation from the list to view its details and messages."
        />
      </div>
    );
  };

 

  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {currentConversation?.title}
            </h2>
            <p className="text-sm text-gray-500">
              Started {formatDate(currentConversation?.start_time)}
              {currentConversation.end_time && ` • Ended ${formatDate(currentConversation.end_time)}`}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(
                currentConversation.sentiment
              )} border`}
            >
              {currentConversation.sentiment || 'Neutral'}
            </span>
            <span className="text-sm text-gray-500">
              {currentConversation.message_count || 0} messages
            </span>
          </div>
        </div>

        {/* Key Topics */}
        {currentConversation.key_topics && currentConversation.key_topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentConversation?.key_topics.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary Section */}
      {currentConversation.summary && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Conversation Summary
          </h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            {currentConversation.summary}
          </p>
        </div>
      )}

      {/* Action Items */}
      {currentConversation.action_items && currentConversation.action_items.length > 0 && (
        <div className="px-6 py-4 bg-green-50 border-b border-green-100">
          <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Action Items
          </h3>
          <ul className="text-green-800 text-sm space-y-1">
            {currentConversation.action_items.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            Messages ({currentConversation.messages?.length || 0})
          </h3>
        </div>

        {!currentConversation.messages || currentConversation.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon="💬"
              title="No messages"
              description="This conversation doesn't have any messages yet."
            />
          </div>
        ) : (
          <div className="p-6 max-h-[600px] overflow-y-auto space-y-4">
            {currentConversation.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};