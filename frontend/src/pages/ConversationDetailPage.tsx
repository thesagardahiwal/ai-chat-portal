import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Conversation } from "../types";
import { apiService } from "../services/api";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { Button } from "../components/common/Button";
import { Layout } from "../components/layout/Layout";
import { MessageBubble } from "../components/chat/MessageBubble";

export const ConversationDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleBack = () => {
        navigate(-1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    useEffect(() => {
        const loadConversation = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await apiService.getConversation(parseInt(id));
                setConversation(data);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load conversation"
                );
            } finally {
                setLoading(false);
            }
        };
        loadConversation();
    }, [id]);


    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                </div>
            </Layout>
        );
    };

    if (error) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <EmptyState
                        icon="⚠️"
                        title="Error"
                        description={error}
                    />
                </div>
            </Layout>
        );
    };

    if (!conversation) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <EmptyState
                        icon="💬"
                        title="No Conversation Found"
                        description="The conversation you are looking for does not exist."
                    />
                </div>
            </Layout>
        );
    };

    // Detailed view for ended conversations
    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant='secondary' size="sm" onClick={handleBack}>
                            ←
                        </Button>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {conversation.title}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${conversation.status.indexOf("active") !== -1
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                        >
                            {conversation.status}
                        </span>

                        {conversation.sentiment && (
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${conversation.sentiment === "positive"
                                        ? "bg-green-100 text-green-700"
                                        : conversation.sentiment === "negative"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                            >
                                {conversation.sentiment}
                            </span>
                        )}
                    </div>
                </div>

                {/* Meta info */}
                <p className="text-sm text-gray-500">
                    Started {formatDate(conversation.start_time)}{" "}
                    {conversation.end_time && (
                        <>• Ended {formatDate(conversation.end_time)}</>
                    )}{" "}
                    • {conversation.messages?.length || 0} messages
                </p>

                {/* Summary Card */}
                {conversation.summary && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                            Summary
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {conversation.summary}
                        </p>
                    </div>
                )}

                {/* Key Topics */}
                {conversation.key_topics?.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-800">
                            Key Topics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {conversation.key_topics.map((topic, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Items */}
                {conversation.action_items?.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5 sm:p-6">
                        <h3 className="text-sm font-semibold text-green-800 mb-2">
                            Action Items
                        </h3>
                        <ul className="list-disc pl-5 text-sm text-green-700 space-y-1">
                            {conversation.action_items.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Messages Section */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-base font-semibold text-gray-900">
                            Messages
                        </h3>
                    </div>

                    <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-3 sm:space-y-4">
                        {conversation.messages && conversation.messages.length > 0 ? (
                            conversation.messages.map((msg) => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))
                        ) : (
                            <EmptyState
                                icon="💬"
                                title="No messages"
                                description="This conversation has no messages yet."
                            />
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};