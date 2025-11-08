// types/index.ts
export interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  embeddings?: number[];
}

export interface Conversation {
  id: number;
  title: string;
  user: number;
  status: 'active' | 'ended';
  start_time: string;
  end_time?: string;
  summary?: string;
  sentiment?: string;
  key_topics: string[];
  action_items: string[];
  messages?: Message[];
  message_count?: number;
  last_message?: string;
}

export interface ConversationAnalysis {
  id: number;
  conversation: number;
  sentiment_score?: number;
  topic_distribution: Record<string, number>;
  key_phrases: string[];
  conversation_length: number;
  average_response_time?: number;
  created_at: string;
}

export interface ChatResponse {
  conversation: Conversation;
  user_message: Message;
  ai_message: Message;
}

export interface QueryRequest {
  query: string;
  date_range?: {
    start?: string;
    end?: string;
  };
  topics?: string[];
}

export interface QueryResponse {
  answer: string;
  relevant_conversations: string[];
  supporting_excerpts: Array<{
    conversation: string;
    content: string;
    sender: string;
    similarity: number;
    timestamp: string;
  }>;
}