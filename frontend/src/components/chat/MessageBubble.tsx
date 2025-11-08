import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types';

interface MessageBubbleProps {
    message: Message;
    isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming = false }) => {
    const isUser = message.sender === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 max-w-5xl px-2 sm:px-4`}>
            <div
                className={`relative max-w-[85%] md:max-w-[75%] lg:max-w-[65%] rounded-2xl px-4 py-2 shadow-sm
          ${isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'}
        `}
            >
                {/* Message Content */}
                <div
                    className={`max-w-full w-full break-words whitespace-pre-wrap leading-snug ${isUser ? 'text-white' : 'text-gray-900'}`}
                    style={{
                        lineHeight: '1.3',
                        wordBreak: 'break-word', // ensure long words wrap
                        overflowWrap: 'anywhere', // handle long URLs or unbroken text
                        wordWrap: 'break-word',
                    }}
                >
                    {isUser ? (
                        <div>{message.content}</div>
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>

                {/* Timestamp */}
                <div
                    className={`text-xs mt-1.5 flex items-center gap-1 ${isUser ? 'text-blue-100' : 'text-gray-500'
                        }`}
                >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                    {isStreaming && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span>Streaming...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
