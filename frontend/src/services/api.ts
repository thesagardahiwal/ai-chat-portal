// src/services/api.ts
import type { 
  Conversation, 
  ChatResponse, 
  QueryRequest, 
  QueryResponse 
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  private async getCSRFToken(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/csrf/`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken || '';
      }
    } catch (error) {
      console.warn('Failed to get CSRF token:', error);
    }
    return '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    
    // Prepare headers - start with basic headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    // Add CSRF token for non-GET requests
    if (options.method && options.method !== 'GET') {
      const csrfToken = await this.getCSRFToken();
      if (csrfToken) {
        headers.set('X-CSRFToken', csrfToken);
      }
    }

    // Add Authorization header if token exists
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }

    // Merge with existing headers from options
    if (options.headers) {
      const existingHeaders = new Headers(options.headers);
      existingHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: 'include', // Important for session cookies
      ...options,
    };

    // Remove body from config if it's a GET request
    if (config.method === 'GET') {
      delete config.body;
    }

    console.log('Making request to:', url, 'with config:', {
      method: config.method,
      headers: Object.fromEntries(headers.entries()),
      hasBody: !!config.body
    });

    const response = await fetch(url, config);
    
    console.log('Response status:', response.status, response.statusText);

    if (response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Authentication required. Please login again.');
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        console.error('API error details:', errorData);
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0' || response.status === 204) {
      return {} as T;
    }

    return await response.json();
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/conversations/');
  }

  async getConversation(id: number): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}/`);
  }

  async createConversation(title: string): Promise<Conversation> {
    return this.request<Conversation>('/conversations/', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  // Messages - Standard (non-streaming)
  async sendMessage(content: string, conversationId?: number): Promise<ChatResponse> {
    return this.request<ChatResponse>('/conversations/send_message/', {
      method: 'POST',
      body: JSON.stringify({
        content,
        conversation_id: conversationId,
      }),
    });
  }

  // Messages - Streaming
  async *sendMessageStream(
    content: string, 
    conversationId?: number
  ): AsyncGenerator<any, void, unknown> {
    const url = `${API_BASE_URL}/conversations/send_message_stream/`;
    const token = localStorage.getItem('auth_token');
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    // Add CSRF token
    const csrfToken = await this.getCSRFToken();
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }

    // Add Authorization header if token exists
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }

    console.log('Making streaming request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        content,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available for streaming response');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data.trim() === '') continue;

            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              console.error('Error parsing stream data:', e, 'Raw data:', data);
              // Continue processing other lines even if one fails
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data.trim() !== '') {
          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.error('Error parsing final stream data:', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async endConversation(conversationId: number): Promise<Conversation> {
    return this.request<Conversation>(
      `/conversations/${conversationId}/end_conversation/`,
      { method: 'POST' }
    );
  }

  // Intelligence
  async queryConversations(queryData: QueryRequest): Promise<QueryResponse> {
    return this.request<QueryResponse>('/conversations/query_conversations/', {
      method: 'POST',
      body: JSON.stringify(queryData),
    });
  }

  // Auth methods
  async login(credentials: { username: string; password: string }) {
    return this.request<{ user: any; token: string; message: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials: { username: string; email: string; password: string; first_name?: string; last_name?: string }) {
    return this.request<{ user: any; token: string; message: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request<void>('/auth/logout/', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me/');
  }
}

export const apiService = new ApiService();