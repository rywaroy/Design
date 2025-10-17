import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { App, Button, Empty, Spin } from 'antd';
import { createSession, sendChatMessage, type ChatResponsePayload, type SessionItem } from '../../services/chat';
import type { ChatConversationMessage } from './types';
import { DEFAULT_ASPECT_RATIO_OPTIONS, DEFAULT_PLACEHOLDER, deriveSessionTitle, scrollToBottom } from './utils';
import useAutoScroll from './hooks/useAutoScroll';
import useUpload from './hooks/useUpload';
import useModels from './hooks/useModels';
import MessageList from './components/MessageList';
import Composer from './components/Composer';
import ModelSelector from './components/ModelSelector';

export type { ChatConversationMessage } from './types';

export interface ChatConversationProps {
  sessionId?: string;
  messages: ChatConversationMessage[];
  loading?: boolean;
  maxImageCount?: number;
  aspectRatioOptions?: { label: string; value: string }[];
  hasMoreMessages?: boolean;
  loadingMoreMessages?: boolean;
  onLoadMoreMessages?: () => Promise<void> | void;
  placeholder?: string;
  onMessagesChange?: (messages: ChatConversationMessage[]) => void;
  onSessionCreate?: (session: SessionItem) => void;
  onMessageCreate?: (message: ChatConversationMessage) => void;
  onError?: (error: Error) => void;
}

const ChatConversation: React.FC<ChatConversationProps> = ({
  sessionId,
  messages,
  loading,
  maxImageCount = 4,
  aspectRatioOptions = DEFAULT_ASPECT_RATIO_OPTIONS,
  hasMoreMessages,
  loadingMoreMessages,
  onLoadMoreMessages,
  placeholder = DEFAULT_PLACEHOLDER,
  onMessagesChange,
  onSessionCreate,
  onMessageCreate,
  onError,
}) => {
  const { message: messageApi } = App.useApp();
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId ?? null);
  const [internalMessages, setInternalMessages] = useState<ChatConversationMessage[]>(messages);
  const {
    fileList,
    setFileList,
    customRequest: handleUpload,
    onChange: handleUploadChange,
    onRemove: handleRemove,
    beforeUpload: handleBeforeUpload,
    reset: resetUpload,
    getImageUrls,
  } = useUpload({
    maxImageCount,
    notifyError: (msg) => messageApi.error(msg),
  });
  const notifyError = useCallback((msg: string) => messageApi.error(msg), [messageApi]);
  const { modelOptions: modelOptionsState, activeModel, setActiveModel, currentModel } = useModels({
    onError,
    notifyError,
  });
  const [activeAspectRatio, setActiveAspectRatio] = useState<string>(
    aspectRatioOptions?.[0]?.value ?? DEFAULT_ASPECT_RATIO_OPTIONS[0].value,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesPropRef = useRef(messages);
  const prevSessionIdPropRef = useRef(sessionId);
  // Track if messages were injected from parent (refresh or switching history)
  const propInjectedRef = useRef(false);
  // Track if load-more was triggered by scrolling near top (should NOT force bottom)
  const loadingMoreByScrollRef = useRef(false);
  // Track if the incoming props.messages change was caused by our own onMessagesChange callback
  const fromInternalUpdateRef = useRef(false);

  const ensureScrollBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    scrollToBottom(container);
    let run = 0;
    const id = window.setInterval(() => {
      const c = scrollRef.current;
      if (!c) {
        window.clearInterval(id);
        return;
      }
      scrollToBottom(c);
      run += 1;
      if (run >= 6) {
        window.clearInterval(id);
      }
    }, 60);
  }, []);
  useAutoScroll(scrollRef, internalMessages);

  const emitMessagesChange = useCallback(
    (
      updater:
        | ChatConversationMessage[]
        | ((prev: ChatConversationMessage[]) => ChatConversationMessage[]),
    ) => {
      setInternalMessages((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // mark that the next props.messages change is from our own update
        fromInternalUpdateRef.current = true;
        onMessagesChange?.(next);
        return next;
      });
    },
    [onMessagesChange],
  );

  useEffect(() => {
    if (prevMessagesPropRef.current !== messages) {
      prevMessagesPropRef.current = messages;
      setInternalMessages(messages);
      // mark as external injection only if not triggered by load-more from top
      if (loadingMoreByScrollRef.current) {
        propInjectedRef.current = false;
        loadingMoreByScrollRef.current = false;
      } else if (fromInternalUpdateRef.current) {
        // this change came from our own onMessagesChange loop-back; do not auto scroll
        propInjectedRef.current = false;
        fromInternalUpdateRef.current = false;
      } else {
        propInjectedRef.current = true;
      }
    }
  }, [messages]);

  // After internal messages updated from prop injection, scroll to bottom once
  useLayoutEffect(() => {
    if (!propInjectedRef.current) return;
    const container = scrollRef.current;
    if (!container) return;
    // schedule twice to ensure children (images, markdown) layout applied
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ensureScrollBottom();
        propInjectedRef.current = false;
      });
    });
  }, [internalMessages, ensureScrollBottom]);

  // When loading transitions to false (data ready), force scroll to bottom
  const prevLoadingRef = useRef(loading);
  useEffect(() => {
    const prev = prevLoadingRef.current;
    prevLoadingRef.current = loading;
    if (prev && !loading) {
      const container = scrollRef.current;
      if (!container) return;
      requestAnimationFrame(() => {
        ensureScrollBottom();
      });
    }
  }, [loading, ensureScrollBottom]);

  const availableAspectRatioOptions = useMemo(() => {
    if (!aspectRatioOptions || aspectRatioOptions.length === 0) {
      return DEFAULT_ASPECT_RATIO_OPTIONS;
    }
    return aspectRatioOptions;
  }, [aspectRatioOptions]);

  // aspect ratio options are passed to Composer; menu items handled there

  useEffect(() => {
    if (!activeAspectRatio && availableAspectRatioOptions.length > 0) {
      setActiveAspectRatio(availableAspectRatioOptions[0].value);
      return;
    }

    if (
      activeAspectRatio &&
      !availableAspectRatioOptions.some((option) => option.value === activeAspectRatio)
    ) {
      setActiveAspectRatio(availableAspectRatioOptions[0]?.value);
    }
  }, [activeAspectRatio, availableAspectRatioOptions]);

  const resetComposer = useCallback(() => {
    setInputValue('');
    resetUpload();
  }, [resetUpload]);

  useEffect(() => {
    if (prevSessionIdPropRef.current !== sessionId) {
      prevSessionIdPropRef.current = sessionId;
      setCurrentSessionId(sessionId ?? null);
      resetComposer();
    }
  }, [resetComposer, sessionId]);

  const canSubmit = useMemo(() => {
    const trimmed = inputValue.trim();
    const hasText = trimmed.length > 0;
    const hasImages = getImageUrls().length > 0;
    return hasText || hasImages;
  }, [getImageUrls, inputValue]);

  const triggerLoadMore = useCallback(() => {
    if (!onLoadMoreMessages || loadingMoreMessages || !hasMoreMessages) {
      return;
    }
    // flag so we don't force bottom after messages prop updates due to load more
    loadingMoreByScrollRef.current = true;
    void onLoadMoreMessages();
  }, [hasMoreMessages, loadingMoreMessages, onLoadMoreMessages]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop < 120) {
        triggerLoadMore();
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollRef, triggerLoadMore]);

  const ensureSession = useCallback(
    async (payload: { content?: string; images: string[] }) => {
      if (currentSessionId) {
        return currentSessionId;
      }
      try {
        const title = deriveSessionTitle(payload.content, '新对话');
        const response = await createSession({ title });
        const created = response.data;
        if (!created?._id) {
          throw new Error('会话创建失败');
        }
        setCurrentSessionId(created._id);
        onSessionCreate?.(created);
        return created._id;
      } catch (error) {
        messageApi.error('创建会话失败，请稍后重试');
        onError?.(error as Error);
        throw error;
      }
    },
    [currentSessionId, messageApi, onError, onSessionCreate],
  );

  const handleSubmit = async () => {
    if (!canSubmit || submitting) {
      return;
    }
    if (!activeModel) {
      messageApi.warning('请先选择模型');
      return;
    }
    const imageUrls = getImageUrls();
    const trimmed = inputValue.trim();
    const snapshot = { text: inputValue, files: fileList };

    let ensuredSessionId: string | null = null;
    let optimisticId: string | null = null;
    let loadingMessageId: string | null = null;

    try {
      setSubmitting(true);
      setSending(true);

      ensuredSessionId = await ensureSession({ content: trimmed, images: imageUrls });
      if (!ensuredSessionId) {
        throw new Error('会话创建失败');
      }

      resetComposer();

      optimisticId = `temp-${Date.now()}`;
      const optimisticMessage: ChatConversationMessage = {
        id: optimisticId,
        role: 'user',
        content: trimmed.length > 0 ? trimmed : undefined,
        images: imageUrls,
        createdAt: new Date().toISOString(),
      };
      emitMessagesChange((prev) => [...prev, optimisticMessage]);
      onMessageCreate?.(optimisticMessage);

      // add assistant loading placeholder
      loadingMessageId = `loading-${Date.now()}`;
      const loadingMessage: ChatConversationMessage = {
        id: loadingMessageId,
        role: 'assistant',
        loading: true,
        createdAt: new Date().toISOString(),
      };
      emitMessagesChange((prev) => [...prev, loadingMessage]);
      // user just sent a message: force scroll to bottom
      requestAnimationFrame(() => {
        const container = scrollRef.current;
        if (container) scrollToBottom(container);
      });

      const response = await sendChatMessage({
        sessionId: ensuredSessionId,
        content: trimmed.length > 0 ? trimmed : undefined,
        images: imageUrls,
        model: activeModel,
        aspectRatio: activeAspectRatio,
      });

      const assistantPayload: ChatResponsePayload | undefined = response.data;
      if (assistantPayload) {
        const updatedAssistant: ChatConversationMessage = {
          id: loadingMessageId ?? `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantPayload.content,
          images: assistantPayload.images ?? [],
          metadata: assistantPayload.metadata,
          createdAt: new Date().toISOString(),
          loading: false,
        };
        // replace loading placeholder with actual assistant message
        emitMessagesChange((prev) =>
          prev.map((item) => (item.id === loadingMessageId ? updatedAssistant : item)),
        );
        onMessageCreate?.(updatedAssistant);
      }
    } catch (error) {
      if (optimisticId) {
        emitMessagesChange((prev) => prev.filter((item) => item.id !== optimisticId));
      }
      if (loadingMessageId) {
        emitMessagesChange((prev) => prev.filter((item) => item.id !== loadingMessageId));
      }
      setInputValue(snapshot.text);
      setFileList(snapshot.files);
      messageApi.error('发送失败，请稍后重试');
      onError?.(error as Error);
    } finally {
      setSubmitting(false);
      setSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-200 bg-[#f9fafb]">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className='flex items-center'>
          <ModelSelector options={modelOptionsState} value={activeModel} onChange={setActiveModel} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6" ref={scrollRef}>
        {loading && (
          <div className="flex h-full items-center justify-center">
            <Spin tip="加载会话" />
          </div>
        )}

        {!loading && internalMessages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <Empty description="开始一段新的创作对话吧" />
          </div>
        )}

        {hasMoreMessages && (
          <div className="mb-4 flex justify-center">
            {loadingMoreMessages ? (
              <Spin size="small" tip="加载更多消息中" />
            ) : (
              <Button type="text" size="small" onClick={triggerLoadMore}>
                查看更早的记录
              </Button>
            )}
          </div>
        )}

        <MessageList messages={internalMessages} />
      </div>

      <Composer
        inputValue={inputValue}
        onInputChange={setInputValue}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        fileList={fileList}
        beforeUpload={handleBeforeUpload}
        onChange={handleUploadChange}
        onRemove={handleRemove}
        customRequest={handleUpload}
        aspectRatioOptions={availableAspectRatioOptions}
        aspectRatio={activeAspectRatio}
        onAspectRatioChange={setActiveAspectRatio}
        sending={sending}
        submitting={submitting}
        canSubmit={canSubmit}
        hasActiveModel={Boolean(activeModel)}
        onSubmit={() => handleSubmit()}
      />
    </div>
  );
};

export default ChatConversation;
