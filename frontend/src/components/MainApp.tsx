// src/components/MainApp.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import { Sidebar } from './layout/Sidebar';
import { ChatPage } from '../pages/ChatPage';
import { ConversationsPage } from '../pages/ConversationsPage';
import { IntelligencePage } from '../pages/IntelligencePage';
import { useConversations } from '../hooks/useConversations';
import { useAuth } from '../context/AuthContext';
import type { Conversation } from '../types';
import { Menu } from 'lucide-react';
import { ConversationDetailPage } from '../pages/ConversationDetailPage';
import { EmptyState } from './common/EmptyState';

type ViewType = 'chat' | 'conversations' | 'intelligence';

export const MainApp: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('chat');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const { conversations, loading, error, refreshConversations } = useConversations();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Close mobile sidebar when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNewConversation = () => {
        setSelectedConversation(null);
        navigate('/conversation/new');
        setSidebarOpen(false);
    };

    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        navigate('/conversation/'+conversation.id);
        setSidebarOpen(false);
    };

    const handleViewChange = (view: ViewType) => {
        setCurrentView(view);
        if (view === 'conversations') {
            navigate('/conversations');
        } else if (view === 'intelligence') {
            navigate('/intelligence');
        } else if (view === 'chat') {
            navigate('/conversation/new');
        }
        setSidebarOpen(false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                currentView={currentView}
                onViewChange={(view) => handleViewChange(view as ViewType)}
                user={user}
                onLogout={logout}
                onNewConversation={handleNewConversation}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">AI</span>
                        </div>
                        <span className="font-semibold text-gray-900">AI Assistant</span>
                    </div>
                    <div className="w-9"></div> {/* Spacer for balance */}
                </div>

                <main className="flex-1 overflow-auto">
                    <div className="h-full">
                        {error && (
                            <div className="m-4 bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Error loading conversations
                                        </h3>
                                        <div className="mt-1 text-sm text-red-700">
                                            {error}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Routes>
                             <Route path="/" element={<Navigate to="/conversation/new" replace />} />
                            <Route path='conversation/new' element={
                                <ChatPage
                                onConversationUpdate={refreshConversations}
                                selectedConversation={selectedConversation}
                                onConversationSelect={setSelectedConversation}
                                />
                            }
                            />
                            <Route path='conversations' element={
                                <ConversationsPage
                                conversations={conversations}
                                loading={loading}
                                onRefresh={refreshConversations}
                                onSelectConversation={handleSelectConversation}
                                />
                            } />
                            <Route path='intelligence' element={
                                <IntelligencePage conversations={conversations} />
                            } />
                            <Route path='conversation/:id' element={<ConversationDetailPage />} />
                            <Route path="*" element={<EmptyState title='404 NOT FOUND'/>} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
};