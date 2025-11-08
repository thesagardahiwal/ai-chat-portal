// src/components/layout/Sidebar.tsx
import React from 'react';
import { 
  MessageSquare, 
  History, 
  Brain, 
  Settings, 
  LogOut, 
  Plus,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import type { User as UserType, Conversation } from '../../types';
import { Link, useNavigate } from 'react-router-dom';

interface SidebarProps {
  currentView: string;
  onViewChange?: (view: string) => void;
  user: UserType | null;
  onLogout: () => void;
  onNewConversation: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  user, 
  onLogout,
  onNewConversation,
  collapsed,
  onToggleCollapse,
  conversations,
  onSelectConversation,
  selectedConversationId,
  sidebarOpen,
  onToggleSidebar
}) => {

  const navigate = useNavigate();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return 'No messages';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 
        fixed md:relative 
        z-50 
        inset-y-0 left-0 
        w-80 md:w-64 
        bg-white border-r border-gray-200 
        shadow-lg md:shadow-none
        transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
                <p className="text-xs text-gray-500">Premium Intelligence</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
              <Brain className="w-5 h-5 text-white" />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {/* Mobile close button */}
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            
            {/* Collapse button */}
            {/* <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden md:block"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button> */}
          </div>
        </div>

        {/* Intelligence Section */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => {
              navigate('/intelligence');
              onToggleSidebar();
            }}
            className={`w-full flex items-center space-x-3 rounded-xl p-3 transition-all duration-200 group ${
              currentView === 'intelligence'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Brain className={`w-5 h-5 flex-shrink-0 ${
              currentView === 'intelligence' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
            }`} />
            {!collapsed && (
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">Conversation Intelligence</div>
                <div className="text-xs text-gray-500 mt-0.5">Analyze your chat history</div>
              </div>
            )}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => {
              onNewConversation();
              onToggleSidebar();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 px-4 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            {!collapsed && <span className="font-medium">New Chat</span>}
          </button>
        </div>

        {/* Search Bar */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {!collapsed && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Recent Conversations</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {conversations.length}
                </span>
              </div>
            )}
            
            <div className="space-y-2">
              {conversations.length === 0 ? (
                !collapsed && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No conversations yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start a chat to see history</p>
                  </div>
                )
              ) : (
                conversations.slice(0, collapsed ? 6 : 20).map((conversation) => (
                  <Link
                    to={`/conversation/`+conversation.id}
                    key={conversation.id}
                    onClick={() => {
                        onSelectConversation(conversation);
                    }}
                    className={`w-full flex items-start space-x-3 rounded-xl p-3 transition-all duration-200 group ${
                      selectedConversationId === conversation.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      selectedConversationId === conversation.id 
                        ? 'text-blue-600' 
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    
                    {!collapsed && (
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium truncate ${
                            selectedConversationId === conversation.id 
                              ? 'text-blue-700' 
                              : 'text-gray-900'
                          }`}>
                            {conversation.title}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatDate(conversation.start_time)}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {truncateText(conversation.last_message || conversation.summary || 'No messages', 60)}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              conversation.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {conversation.status}
                            </span>
                            {conversation.message_count != undefined && (
                              <span className="text-xs text-gray-500">
                                {conversation.message_count} messages
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>

            {/* Show more indicator when collapsed */}
            {collapsed && conversations.length > 6 && (
              <div className="text-center mt-2">
                <span className="text-xs text-gray-400">+{conversations.length - 6} more</span>
              </div>
            )}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          {!collapsed ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.first_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-1">
                <button 
                  onClick={() => {
                    navigate('/conversations');
                    onToggleSidebar();
                  }}
                  className="w-full flex items-center space-x-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl px-3 py-2 transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span className="text-sm">All Conversations</span>
                </button>
                {/* <button className="w-full flex items-center space-x-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl px-3 py-2 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Settings</span>
                </button> */}
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl px-3 py-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};