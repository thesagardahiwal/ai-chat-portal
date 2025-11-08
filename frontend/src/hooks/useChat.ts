// src/hooks/useChat.ts
import { useState, useCallback } from 'react';
import type { Conversation, Message } from '../types';
import { apiService } from '../services/api';

export const useChat = (onConversationUpdate: () => void) => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');

  const sendMessage = useCallback(async (content: string, useStreaming: boolean = true) => {
    if (!content.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStreamedResponse('');

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: Date.now(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      if (useStreaming) {
        setStreaming(true);
        
        let finalUserMessage: Message | null = null;
        let finalAiMessage: Message | null = null;
        let tempConversation: Conversation | null = currentConversation;

        for await (const chunk of apiService.sendMessageStream(content, currentConversation?.id)) {
          switch (chunk.type) {
            case 'user_message':
              // Server-confirmed user message
              finalUserMessage = chunk.data;
              setMessages(prev => prev.map(msg => 
                msg.id === tempUserMessage.id ? finalUserMessage! : msg
              ));
              break;
            
            case 'ai_chunk':
              // Streamed AI response chunk
              setStreamedResponse(prev => prev + chunk.data);
              break;
            
            case 'ai_message':
              // Complete AI message from server
              finalAiMessage = chunk.data;
              setMessages(prev => [...prev, finalAiMessage!]);
              setStreamedResponse('');
              break;
            
            case 'conversation':
              // Updated conversation data
              tempConversation = chunk.data;
              setCurrentConversation(chunk.data);
              break;
            
            case 'complete':
              // Streaming complete
              setStreaming(false);
              onConversationUpdate();
              break;
            
            case 'error':
              throw new Error(chunk.data);
            
            default:
              console.warn('Unknown chunk type:', chunk.type);
          }
        }

        // Final cleanup
        if (!finalAiMessage && streamedResponse) {
          // Create AI message from streamed content if not provided by server
          const aiMessage: Message = {
            id: Date.now() + 1,
            content: streamedResponse,
            sender: 'ai',
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, aiMessage]);
          setStreamedResponse('');
        }

      } else {
        // Non-streaming fallback
        const response = await apiService.sendMessage(content, currentConversation?.id);
        setCurrentConversation(response.conversation);
        setMessages(response.conversation.messages || []);
        onConversationUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Remove optimistic user message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: "Sorry, I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setStreaming(false);
      setStreamedResponse('');
    }
  }, [currentConversation, loading, onConversationUpdate, streamedResponse]);

  const endConversation = useCallback(async () => {
    if (!currentConversation) return;

    try {
      await apiService.endConversation(currentConversation.id);
      setCurrentConversation(null);
      setMessages([]);
      onConversationUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end conversation');
    }
  }, [currentConversation, onConversationUpdate]);

  const startNewConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
    setStreamedResponse('');
  }, []);

  const loadConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages || []);
    setError(null);
    setStreamedResponse('');
  }, []);

  return {
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
  };
};