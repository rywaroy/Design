import React from 'react';
import type { ChatConversationMessage } from '../types';
import MessageItem from './MessageItem';

export interface MessageListProps {
  messages: ChatConversationMessage[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex flex-col gap-6">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;
