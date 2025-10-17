import React from 'react';
import { Image, Space, Spin } from 'antd';
import {
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
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

  const onDownload = (current: number) => {
    const url = message.images?.[current];
    if (!url) return;
    const suffix = url.includes('.') ? url.slice(url.lastIndexOf('.')) : '';
    const filename = `${Date.now()}${suffix}`;
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(blobUrl);
        link.remove();
      });
  };

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
        <Image.PreviewGroup
          items={message.images.map((url) => ({ src: url }))}
          preview={{
            toolbarRender: (
              _,
              {
                transform: { scale },
                actions: {
                  onActive,
                  onFlipY,
                  onFlipX,
                  onRotateLeft,
                  onRotateRight,
                  onZoomOut,
                  onZoomIn,
                },
                current,
              },
            ) => {
              const total = message.images?.length ?? 0;
              

              return (
                <Space size={12} className="message-item-image-toolbar-wrapper">
                  <LeftOutlined disabled={current === 0} onClick={() => onActive?.(-1)} />
                  <RightOutlined disabled={current === total - 1} onClick={() => onActive?.(1)} />
                  <SwapOutlined rotate={90} onClick={onFlipY} />
                  <SwapOutlined onClick={onFlipX} />
                  <RotateLeftOutlined onClick={onRotateLeft} />
                  <RotateRightOutlined onClick={onRotateRight} />
                  <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                  <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                  <DownloadOutlined onClick={() => onDownload(current)} />
                </Space>
              );
            },
          }}
        >
          <div
            className={`base-message-images flex flex-wrap gap-3 items-start ${isUser ? 'self-end' : 'self-start'}`}
          >
            {message.images.map((url, index) => (
              <div className='rounded-xl overflow-hidden' key={`${message.id}-image-${index}`}>
                <Image
                  src={url}
                  alt="生成的图片"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </Image.PreviewGroup>
      )}
    </div>
  );
};

export default MessageItem;
