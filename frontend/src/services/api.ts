// services/api.ts
import type { Conversation, ChatResponse, QueryRequest, QueryResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
};

export const apiService = {
  // Conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await fetch(`${API_BASE_URL}/conversations/`);
    return handleResponse(response);
  },

  getConversation: async (id: number): Promise<Conversation> => {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}/`);
    return handleResponse(response);
  },

  createConversation: async (title: string): Promise<Conversation> => {
    const response = await fetch(`${API_BASE_URL}/conversations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    return handleResponse(response);
  },

  // Messages
  sendMessage: async (content: string, conversationId?: number): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE_URL}/conversations/send_message/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        conversation_id: conversationId,
      }),
    });
    return handleResponse(response);
  },

  endConversation: async (conversationId: number): Promise<Conversation> => {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/end_conversation/`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Intelligence
  queryConversations: async (queryData: QueryRequest): Promise<QueryResponse> => {
    const response = await fetch(`${API_BASE_URL}/conversations/query_conversations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryData),
    });
    return handleResponse(response);
  },
};