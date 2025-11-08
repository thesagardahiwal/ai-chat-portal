// src/services/auth.ts
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

class AuthService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
      ...options,
    };

    console.log('Auth request to:', url);

    const response = await fetch(url, config);
    
    console.log('Auth response status:', response.status);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    console.log('Login response:', response);
    return response;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    console.log('Register response:', response);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout/', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Logout error:', error);
      // Still clear local storage even if logout fails
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me/');
    return response.user;
  }

  async getCSRFToken(): Promise<string> {
    try {
      const response = await this.request<{ csrfToken: string }>('/auth/csrf/');
      return response.csrfToken;
    } catch (error) {
      console.warn('CSRF token fetch failed:', error);
      return '';
    }
  }
}

export const authService = new AuthService();