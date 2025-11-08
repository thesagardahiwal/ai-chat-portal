// src/pages/IntelligencePage.tsx
import React, { useState } from 'react';
import type { Conversation, QueryRequest, QueryResponse } from '../types';
import { apiService } from '../services/api';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface IntelligencePageProps {
  conversations: Conversation[];
}

export const IntelligencePage: React.FC<IntelligencePageProps> = ({
  conversations,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QueryRequest['date_range']>({});
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const queryData: QueryRequest = {
        query: query.trim(),
      };

      // Add filters if specified
      if (filters && (filters.start || filters.end)) {
        queryData.date_range = filters;
      }

      if (selectedTopics.length > 0) {
        queryData.topics = selectedTopics;
      }

      const response = await apiService.queryConversations(queryData);
      console.log(response)
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query conversations');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const extractAllTopics = (): string[] => {
    const allTopics = conversations.flatMap(
      (conv) => conv.key_topics || []
    );
    const uniqueTopics = Array.from(new Set(allTopics));
    return uniqueTopics.sort().slice(0, 20); // Limit to top 20 topics
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedTopics([]);
    setQuery('');
    setResults(null);
    setError(null);
  };

  const allTopics = extractAllTopics();
  const hasActiveFilters = (filters && (filters.start || filters.end)) || selectedTopics.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-hidden h-screen">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Conversation Intelligence
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Ask questions about your past conversations and get AI-powered insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Filters
            </h3>

            {/* Date Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters?.start || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, start: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters?.end || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topics
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allTopics.map((topic) => (
                  <label
                    key={topic}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTopics((prev) => [...prev, topic]);
                        } else {
                          setSelectedTopics((prev) =>
                            prev.filter((t) => t !== topic)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{topic}</span>
                  </label>
                ))}
                {allTopics.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No topics available
                  </p>
                )}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Conversations</span>
                <span className="font-medium text-gray-900">
                  {conversations.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Conversations</span>
                <span className="font-medium text-green-600">
                  {conversations.filter((c) => c.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Messages</span>
                <span className="font-medium text-gray-900">
                  {conversations.reduce(
                    (sum, conv) => sum + (conv.message_count || 0),
                    0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 overflow-y-auto max-h-screen pb-52 scroll-smooth">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Query Input */}
            <div className="p-6 border-b border-gray-200">
              <form onSubmit={handleQuery} className="space-y-4">
                <div>
                  <label
                    htmlFor="query"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Ask about your conversations
                  </label>
                  <textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Examples: 
• What travel plans did we discuss last week?
• Show me conversations about learning programming
• What were the main action items from our meetings?
• Find conversations where we talked about budget planning"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {hasActiveFilters && 'Filters are active • '}
                    Analyzing {conversations.length} conversations
                  </div>
                  <Button
                    type="submit"
                    disabled={!query.trim() || loading}
                    loading={loading}
                  >
                    Analyze Conversations
                  </Button>
                </div>
              </form>
            </div>

            {/* Results */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-400 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-gray-600">Analyzing your conversations...</span>
                </div>
              )}

              {results && !loading && (
                <div className="space-y-6">
                  {/* AI Answer */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      AI Analysis
                    </h3>
                    <div className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                        <Markdown remarkPlugins={[remarkGfm]}>
                            {results.answer}
                        </Markdown>
                    </div>
                  </div>

                  {/* Relevant Conversations */}
                  {results.relevant_conversations?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Relevant Conversations
                      </h3>
                      <div className="grid gap-3">
                        {results.relevant_conversations.map((title, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 text-gray-400 mr-2"
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
                              <span className="text-gray-700">{title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supporting Excerpts */}
                  {results.supporting_excerpts?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Supporting Evidence
                      </h3>
                      <div className="space-y-3">
                        {results.supporting_excerpts?.map((excerpt, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900 text-sm">
                                {excerpt.conversation}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(excerpt.similarity * 100)}% match
                              </span>
                            </div>
                            <div className="text-gray-700 text-sm bg-gray-50 rounded p-3">
                                <Markdown remarkPlugins={[remarkGfm]}>
                                    {excerpt.content}
                                </Markdown>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                              <span>From: {excerpt.sender}</span>
                              <span>
                                {new Date(excerpt.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!results && !loading && !error && (
                <EmptyState
                  icon="🔍"
                  title="Ask about your conversations"
                  description="Use the query box above to ask questions about your past conversations. The AI will analyze all your chats and provide intelligent insights."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};