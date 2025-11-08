// src/hooks/useConversations.ts
import { useState, useEffect, useCallback } from 'react';
import type { Conversation } from '../types';
import { apiService } from '../services/api';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshConversations = useCallback(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    refreshConversations,
  };
};