// src/pages/ConversationsPage.tsx
import React, { useState } from 'react';
import { Search, Calendar, MessageSquare, Play, Filter, X } from 'lucide-react';
import type { Conversation } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

interface ConversationsPageProps {
  conversations: Conversation[];
  loading: boolean;
  onRefresh: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationsPage: React.FC<ConversationsPageProps> = ({
  conversations,
  loading,
  onRefresh,
  onSelectConversation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const filteredConversations = conversations.filter(conv => {
    // Search filter
    const searchMatch = 
      conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(conv.key_topics) && 
       conv.key_topics.some(topic => 
         topic?.toLowerCase().includes(searchTerm.toLowerCase())
       ));

    // Date filter
    const now = new Date();
    const convDate = new Date(conv.start_time);
    const dateMatch = 
      dateFilter === 'all' ||
      (dateFilter === 'today' && convDate.toDateString() === now.toDateString()) ||
      (dateFilter === 'week' && (now.getTime() - convDate.getTime()) < 7 * 24 * 60 * 60 * 1000) ||
      (dateFilter === 'month' && (now.getTime() - convDate.getTime()) < 30 * 24 * 60 * 60 * 1000);

    // Status filter
    const statusMatch = statusFilter === 'all' || conv.status === statusFilter;

    return searchMatch && dateMatch && statusMatch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  };

  const handleContinueChat = (conversation: Conversation) => {
    onSelectConversation(conversation);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchTerm || dateFilter !== 'all' || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">All Conversations</h1>
            <p className="text-gray-600 mt-1">
              Manage and review your conversation history
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={onRefresh}
              variant="secondary"
              size="sm"
            >
              Refresh
            </Button>
            <Button
              onClick={() => onSelectConversation({} as Conversation)}
              size="sm"
            >
              New Chat
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Conversations
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, summary, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-40">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="sm:flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {filteredConversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No conversations found"
            description={conversations.length === 0 
              ? "You haven't had any conversations yet. Start a new chat to begin."
              : "No conversations match your search criteria."
            }
            action={
              conversations.length === 0 ? (
                <Button onClick={() => onSelectConversation({} as Conversation)}>
                  Start Your First Chat
                </Button>
              ) : (
                <Button 
                  onClick={clearFilters}
                  variant="secondary"
                >
                  Clear All Filters
                </Button>
              )
            }
          />
        ) : (
          <div className="grid overflow-y-auto max-h-[400px] bg-white rounded-xl p-2 gap-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            conversation.status === 'active' 
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {conversation.status}
                          </span>
                          {conversation.sentiment && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              conversation.sentiment === 'positive' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : conversation.sentiment === 'negative'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {conversation.sentiment}
                            </span>
                          )}
                        </div>
                      </div>

                      {conversation.summary && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {conversation.summary}
                        </p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{conversation.message_count || 0} messages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(conversation.start_time)}</span>
                        </div>
                      </div>

                      {conversation.key_topics && conversation.key_topics.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {conversation.key_topics.slice(0, 4).map((topic, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {topic}
                            </span>
                          ))}
                          {conversation.key_topics.length > 4 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              +{conversation.key_topics.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-6">
                      <Button
                        onClick={() => handleContinueChat(conversation)}
                        size="sm"
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4" />
                        <span>Continue</span>
                      </Button>
                    </div>
                  </div>

                  {conversation.action_items && conversation.action_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Action Items</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {conversation.action_items.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 text-blue-500">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats and Pagination */}
        {filteredConversations.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 mb-4 sm:mb-0">
              Showing {filteredConversations.length} of {conversations.length} conversations
              {hasActiveFilters && ' (filtered)'}
            </p>
            
            {filteredConversations.length > 10 && (
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="secondary" size="sm">
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};