// src/components/chat/ChatInterface.tsx
import React, { useRef, useEffect, useState } from 'react';
import type { Conversation, Message } from '../../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ChatInterfaceProps {
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  streaming: boolean;
  streamedResponse: string;
  onSendMessage: (message: string, useStreaming?: boolean) => void;
  onEndConversation: () => void;
  onNewConversation: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentConversation,
  messages,
  loading,
  error,
  streaming,
  streamedResponse,
  onSendMessage,
  onEndConversation,
  onNewConversation,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Handle scroll events to disable auto-scroll when user scrolls up
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedResponse]);

  // Merge live streaming content with messages
  const displayMessages = [...messages];
  if (streaming && streamedResponse) {
    const existingStreamingIndex = displayMessages.findIndex(msg => msg.id === -1);
    if (existingStreamingIndex !== -1) {
      displayMessages[existingStreamingIndex] = {
        ...displayMessages[existingStreamingIndex],
        content: streamedResponse,
      };
    } else {
      displayMessages.push({
        id: -1,
        content: streamedResponse,
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Handle error view
  if (error) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
            </div>
            <Button
              onClick={onNewConversation}
              variant="secondary"
              size="sm"
            >
              New Chat
            </Button>
          </div>
        </div>

        {/* Error State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={onNewConversation}>Start New Conversation</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 py-4">
        <ChatHeader
          conversation={currentConversation}
          onEndConversation={onEndConversation}
          onNewConversation={onNewConversation}
        />
      </div>

      {/* Messages Section */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-2xl">AI</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How can I help you today?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-md">
                Ask me anything, and I'll do my best to assist you with clear, helpful responses.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                <button
                  onClick={() => onSendMessage('Can you help me plan a trip to Japan?', true)}
                  className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="text-blue-600 font-medium mb-1">Travel Planning</div>
                  <div className="text-sm text-gray-600">Help me plan a trip to Japan</div>
                </button>
                <button
                  onClick={() => onSendMessage('Explain quantum computing in simple terms', true)}
                  className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="text-blue-600 font-medium mb-1">Learning</div>
                  <div className="text-sm text-gray-600">Explain quantum computing</div>
                </button>
                <button
                  onClick={() => onSendMessage('Help me write a professional email to my manager', true)}
                  className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="text-blue-600 font-medium mb-1">Writing</div>
                  <div className="text-sm text-gray-600">Draft a professional email</div>
                </button>
                <button
                  onClick={() => onSendMessage('What are some healthy dinner recipes?', true)}
                  className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="text-blue-600 font-medium mb-1">Cooking</div>
                  <div className="text-sm text-gray-600">Healthy dinner recipes</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {displayMessages.map((message, index) => (
                <div
                  key={message.id === -1 ? `streaming-${index}` : message.id}
                  className={`group relative ${
                    message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'
                  }`}
                >
                  <MessageBubble
                    message={message}
                    isStreaming={message.id === -1 && streaming}
                  />
                </div>
              ))}

              {/* Loading indicator */}
              {loading && !streaming && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">AI</span>
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-gray-200 shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.4s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll to bottom button */}
              {!autoScroll && (
                <button
                  onClick={() => {
                    setAutoScroll(true);
                    scrollToBottom();
                  }}
                  className="fixed bottom-24 right-8 bg-white border border-gray-300 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <MessageInput
            onSendMessage={(message) => onSendMessage(message, true)}
            disabled={loading}
            loading={loading}
          />
          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};