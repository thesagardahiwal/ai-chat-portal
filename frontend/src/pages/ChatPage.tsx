// src/pages/ChatPage.tsx
import React, { useEffect } from 'react';
import { ChatInterface } from '../components/chat/ChatInterface';
import { useChat } from '../hooks/useChat';
import type { Conversation } from '../types';

interface ChatPageProps {
  onConversationUpdate: () => void;
  selectedConversation?: Conversation | null;
  onConversationSelect: (conversation: Conversation | null) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ 
  onConversationUpdate, 
  selectedConversation,
  onConversationSelect 
}) => {
  const {
    currentConversation,
    messages,
    loading,
    error,
    streaming,
    streamedResponse,
    sendMessage,
    endConversation,
    startNewConversation,
    loadConversation,
  } = useChat(onConversationUpdate);

  // Load selected conversation when it changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.id !== currentConversation?.id) {
      loadConversation(selectedConversation);
    }
  }, [selectedConversation, currentConversation, loadConversation]);

  // Clear current conversation when starting new one
  const handleNewConversation = () => {
    onConversationSelect(null);
    startNewConversation();
  };

  return (
    <div className="h-full">
      <ChatInterface
        currentConversation={currentConversation}
        messages={messages}
        loading={loading}
        error={error}
        streaming={streaming}
        streamedResponse={streamedResponse}
        onSendMessage={sendMessage}
        onEndConversation={endConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
};