// src/components/layout/Header.tsx (Updated)
import React, { useState } from 'react';
import type { User } from '../../types';
import { Button } from '../common/Button';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onViewChange, 
  user, 
  onLogout 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigation = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'conversations', label: 'Conversations', icon: '📚' },
    { id: 'intelligence', label: 'Intelligence', icon: '🔍' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="bg-blue-500 text-white rounded-lg p-2 mr-3">AI</span>
                Chat Portal
              </h1>
            </div>
            
            <nav className="hidden md:flex space-x-8 ml-8">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </span>
                </div>
                <span className="hidden md:block">
                  {user?.first_name || user?.username}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    Signed in as <br />
                    <span className="font-medium text-gray-900">{user?.username}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 border-t border-gray-200 pt-3">
          <div className="flex space-x-4">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex-1 flex flex-col items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};