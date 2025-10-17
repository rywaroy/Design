import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MenuProps, UploadFile, UploadProps } from 'antd';
import { App, Button, Dropdown, Empty, Image, Input, Select, Spin, Upload } from 'antd';
import { CheckOutlined, DownOutlined, PictureOutlined, SendOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  createSession,
  listModels,
  sendChatMessage,
  uploadImages,
  type ChatResponsePayload,
  type SessionItem,
} from '../../services/chat';

export interface ChatConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  images?: string[];
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadResultItem {
  url: string;
  name?: string;
}

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

type ModelOption = {
  value: string;
  name: string;
  model: string;
};

const DEFAULT_ASPECT_RATIO_OPTIONS = [
  { label: '正方形 1:1', value: '1:1' },
  { label: '横向 16:9', value: '16:9' },
  { label: '纵向 9:16', value: '9:16' },
];

const DEFAULT_PLACEHOLDER = '输入描述，按 Enter 发送，Shift + Enter 换行';

const scrollToBottom = (container?: HTMLDivElement | null) => {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
};

const formatDatetime = (value?: string) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

const deriveSessionTitle = (content?: string, fallbackTitle = '新对话') => {
  if (!content) {
    return fallbackTitle;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return fallbackTitle;
  }

  return trimmed.length > 20 ? `${trimmed.slice(0, 20)}...` : trimmed;
};

const useAutoScroll = (
  containerRef: React.RefObject<HTMLDivElement>,
  messages: ChatConversationMessage[],
) => {
  const previousSizeRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const previousSize = previousSizeRef.current;
    const currentSize = messages.length;

    previousSizeRef.current = currentSize;

    if (currentSize === 0) return;
    if (currentSize === previousSize) {
      scrollToBottom(container);
      return;
    }

    const isAppending = currentSize > previousSize;
    if (!isAppending) {
      return;
    }

    const { scrollTop, clientHeight, scrollHeight } = container;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 120;
    if (isNearBottom || previousSize === 0) {
      scrollToBottom(container);
    }
  }, [containerRef, messages]);
};

const normalizeUploadResult = (items: Awaited<ReturnType<typeof uploadImages>>['data']) => {
  if (!items || items.length === 0) {
    return null;
  }
  const target = items[0];
  if (!target?.url) {
    return null;
  }
  return {
    url: target.url,
    name: target.originalname,
  };
};

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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId ?? null);
  const [internalMessages, setInternalMessages] = useState<ChatConversationMessage[]>(messages);
  const [modelOptionsState, setModelOptionsState] = useState<ModelOption[]>([]);
  const [activeModel, setActiveModel] = useState<string>();
  const [activeAspectRatio, setActiveAspectRatio] = useState<string>(
    aspectRatioOptions?.[0]?.value ?? DEFAULT_ASPECT_RATIO_OPTIONS[0].value,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesPropRef = useRef(messages);
  const prevSessionIdPropRef = useRef(sessionId);

  useAutoScroll(scrollRef, internalMessages);

  const emitMessagesChange = useCallback(
    (updater: ChatConversationMessage[] | ((prev: ChatConversationMessage[]) => ChatConversationMessage[])) => {
      setInternalMessages((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
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
    }
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    const fetchModels = async () => {
      try {
        const response = await listModels();
        const enabled = response.data.filter((item) => item.enabled);
        const options = enabled
          .map((item): ModelOption | null => {
            const modelValue = item.model ?? item.name;
            if (!modelValue) {
              return null;
            }
            const displayName = item.name ?? item.model ?? modelValue;
            return {
              value: modelValue,
              name: displayName,
              model: item.model ?? modelValue,
            };
          })
          .filter((item): item is ModelOption => Boolean(item));
        if (!mounted) {
          return;
        }
        setModelOptionsState(options);
        setActiveModel((prev) => {
          if (prev && options.some((option) => option.value === prev)) {
            return prev;
          }
          return options[0]?.value;
        });
      } catch (error) {
        if (mounted) {
          messageApi.error('获取模型列表失败');
          onError?.(error as Error);
        }
      }
    };

    void fetchModels();

    return () => {
      mounted = false;
    };
  }, [messageApi, onError]);

  const availableAspectRatioOptions = useMemo(() => {
    if (!aspectRatioOptions || aspectRatioOptions.length === 0) {
      return DEFAULT_ASPECT_RATIO_OPTIONS;
    }
    return aspectRatioOptions;
  }, [aspectRatioOptions]);

  const currentModel = useMemo(
    () => modelOptionsState.find((option) => option.value === activeModel),
    [activeModel, modelOptionsState],
  );

  const modelMenuItems = useMemo<MenuProps['items']>(() => {
    if (modelOptionsState.length === 0) {
      return [
        {
          key: 'empty',
          disabled: true,
          label: (
            <div className="flex flex-col gap-1 px-4 py-3">
              <span className="text-sm font-medium text-gray-500">暂无可用模型</span>
              <span className="text-xs text-gray-400">请稍后再试</span>
            </div>
          ),
        },
      ];
    }

    return modelOptionsState.map((option) => ({
      key: option.value,
      label: (
        <div className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-gray-100">
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-gray-900">{option.name}</span>
            <span className="text-xs text-gray-500">{option.model}</span>
          </div>
          {activeModel === option.value ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
              <CheckOutlined className="text-[10px] !text-white" />
            </span>
          ) : null}
        </div>
      ),
    }));
  }, [activeModel, modelOptionsState]);

  const handleModelMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      if (key === 'empty') {
        return;
      }
      setActiveModel(key as string);
    },
    [],
  );

  const modelMenu = useMemo<MenuProps>(
    () => ({
      items: modelMenuItems,
      onClick: handleModelMenuClick,
      selectable: false,
      className:
        '!p-2 min-w-[280px] !rounded-xl !bg-white !shadow-[0_16px_32px_-20px_rgba(15,23,42,0.25)] !border !border-gray-100',
    }),
    [handleModelMenuClick, modelMenuItems],
  );

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
    setFileList([]);
  }, []);

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
    const hasImages = fileList.some((file) => {
      const response = file.response as UploadResultItem | undefined;
      return Boolean(file.url || response?.url);
    });
    return hasText || hasImages;
  }, [fileList, inputValue]);

  const triggerLoadMore = useCallback(() => {
    if (!onLoadMoreMessages || loadingMoreMessages || !hasMoreMessages) {
      return;
    }

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

  const handleUpload: UploadProps['customRequest'] = async ({
    file,
    onError: uploadOnError,
    onSuccess,
  }) => {
    try {
      const result = await uploadImages([file as File]);
      const normalized = normalizeUploadResult(result.data);
      if (!normalized) {
        throw new Error('图片上传失败');
      }

      setFileList((prev) =>
        prev.map((item) =>
          item.originFileObj === file
            ? {
                ...item,
                status: 'done',
                url: normalized.url,
                thumbUrl: normalized.url,
                name: normalized.name ?? item.name,
                response: normalized,
              }
            : item,
        ),
      );
      onSuccess?.(normalized);
    } catch (error) {
      setFileList((prev) => prev.filter((item) => item.originFileObj !== file));
      uploadOnError?.(error as Error);
      messageApi.error('图片上传失败，请稍后重试');
      onError?.(error as Error);
    }
  };

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: nextList }) => {
    const normalized = nextList.map((item) => {
      const response = item.response as UploadResultItem | undefined;
      if (!item.url && response?.url) {
        item.url = response.url;
        item.thumbUrl = response.url;
      }
      return item;
    });
    setFileList(normalized);
  };

  const handleRemove: UploadProps['onRemove'] = (file) => {
    setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file, files) => {
    const remaining = maxImageCount - fileList.length;
    if (remaining <= 0) {
      messageApi.warning(`最多上传 ${maxImageCount} 张图片`);
      return Upload.LIST_IGNORE;
    }

    if (files.length > remaining) {
      return files.slice(0, remaining).includes(file);
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) {
      return;
    }

    if (!activeModel) {
      messageApi.warning('请先选择模型');
      return;
    }

    const imageUrls = fileList
      .map((item) => item.url || (item.response as UploadResultItem | undefined)?.url)
      .filter((url): url is string => Boolean(url));
    const trimmed = inputValue.trim();
    const snapshot = {
      text: inputValue,
      files: fileList,
    };

    let ensuredSessionId: string | null = null;
    let optimisticId: string | null = null;

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

      const response = await sendChatMessage({
        sessionId: ensuredSessionId,
        content: trimmed.length > 0 ? trimmed : undefined,
        images: imageUrls,
        model: activeModel,
        aspectRatio: activeAspectRatio,
      });

      const assistantPayload: ChatResponsePayload | undefined = response.data;
      if (assistantPayload) {
        const assistantMessage: ChatConversationMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantPayload.content,
          images: assistantPayload.images ?? [],
          metadata: assistantPayload.metadata,
          createdAt: new Date().toISOString(),
        };
        emitMessagesChange((prev) => [...prev, assistantMessage]);
        onMessageCreate?.(assistantMessage);
      }
    } catch (error) {
      if (optimisticId) {
        emitMessagesChange((prev) => prev.filter((item) => item.id !== optimisticId));
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

  const renderMessage = (message: ChatConversationMessage) => {
    const isUser = message.role === 'user';
    const containerAlign = isUser ? 'items-end' : 'items-start';
    const bubbleBg = isUser ? 'bg-[#111827] text-white' : 'bg-white text-gray-900 border border-gray-200';
    const bubbleAlign = isUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm';
    const metadata = formatDatetime(message.createdAt);

    return (
      <div
        key={message.id}
        className={`flex flex-col gap-2 ${containerAlign}`}
      >
        {metadata && (
          <div className="text-xs text-gray-400">{metadata}</div>
        )}
        {message.content && (
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
                img: ({ node, ...props }) => (
                  <img {...props} className="max-h-72 rounded-lg" />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {message.images && message.images.length > 0 && (
          <Image.PreviewGroup
            items={message.images.map((url) => ({ src: url }))}
          >
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

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-200 bg-[#f9fafb]">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <Dropdown
          trigger={['click']}
          placement="bottomLeft"
          overlayClassName="!p-0"
          menu={modelMenu}
        >
          <div
            className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-3 py-2 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100"
            onClick={(event) => {
              event.preventDefault();
            }}
          >
            {currentModel?.name ?? '选择模型'}
            <DownOutlined className="text-xs text-gray-500" />
          </div>
        </Dropdown>
        <div className="flex items-center gap-3">
          <Select
            className="w-40"
            placeholder="图片比例"
            options={availableAspectRatioOptions}
            value={activeAspectRatio}
            onChange={(value) => setActiveAspectRatio(value)}
          />
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

        <div className="flex flex-col gap-6">
          {internalMessages.map((message) => renderMessage(message))}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 6 }}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            bordered={false}
            className="text-base text-gray-900"
          />
          <div className="mt-3 flex items-center justify-between">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={handleBeforeUpload}
              onChange={handleUploadChange}
              onRemove={handleRemove}
              customRequest={handleUpload}
              multiple
              accept="image/*"
              itemRender={(originNode) => (
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {originNode}
                </div>
              )}
            >
              {fileList.length >= maxImageCount ? null : (
                <div className="flex h-[96px] w-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500">
                  <PictureOutlined className="text-xl" />
                  <span className="text-xs">上传图片</span>
                </div>
              )}
            </Upload>

            <div className="flex items-center gap-3">
              {sending && (
                <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-500" />
                  </span>
                  模型生成中...
                </div>
              )}
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="large"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit || submitting || !activeModel}
                loading={submitting}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;
