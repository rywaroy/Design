import React from 'react';
import { Image, Spin } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatConversationMessage } from '../types';
import { formatDatetime } from '../utils';

export interface MessageItemProps {
  message: ChatConversationMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isLoading = Boolean(message.loading);
  const containerAlign = isUser ? 'items-end' : 'items-start';
  const bubbleBg = isUser
    ? 'bg-[#111827] text-white'
    : 'bg-white text-gray-900 border border-gray-200';
  const bubbleAlign = isUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm';
  const metadata = formatDatetime(message.createdAt);

  return (
    <div className={`flex flex-col gap-2 ${containerAlign}`}>
      {metadata && <div className="text-xs text-gray-400">{metadata}</div>}
      {isLoading && message.role === 'assistant' && (
        <div className={`max-w-[560px] whitespace-pre-wrap break-words px-4 py-3 ${bubbleBg} ${bubbleAlign}`}>
          <Spin size="small" tip="生成中..." />
        </div>
      )}
      {!isLoading && message.content && (
        <div className={`max-w-[560px] whitespace-pre-wrap break-words px-4 py-3 ${bubbleBg} ${bubbleAlign}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="markdown-content"
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noreferrer" className="underline" />
              ),
              code: ({ inline, className, children, ...props }) => {
                if (inline) {
                  return (
                    <code
                      {...props}
                      className={`rounded bg-gray-800/10 px-1 py-0.5 text-[0.85em] ${className ?? ''}`}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="overflow-auto rounded-lg bg-gray-900/95 px-3 py-2 text-sm text-gray-100">
                    <code {...props}>{children}</code>
                  </pre>
                );
              },
              img: ({ node, ...props }) => <img {...props} className="max-h-72 rounded-lg" />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}
      {message.images && message.images.length > 0 && (
        <Image.PreviewGroup items={message.images.map((url) => ({ src: url }))}>
          <div className="grid max-w-[560px] grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {message.images.map((url, index) => (
              <Image
                key={`${message.id}-image-${index}`}
                src={url}
                alt="生成的图片"
                className="h-40 w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </Image.PreviewGroup>
      )}
    </div>
  );
};

export default MessageItem;
