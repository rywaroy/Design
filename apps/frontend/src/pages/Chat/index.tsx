import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Modal, Spin } from 'antd';
import ChatConversation, {
  type ChatConversationMessage,
} from '../../components/ChatConversation';
import {
  listMessages,
  listSessions,
  updateSession,
  removeSession,
  type MessageItem,
  type SessionItem,
} from '../../services/chat';
import { useAuth } from '../../contexts/AuthContext';
import { App as AntApp } from 'antd';
import HistoryPanel, { type HistoryAction } from './components/HistoryPanel';

const SESSION_PAGE_SIZE = 30;
const MESSAGE_PAGE_SIZE = 30;

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

const deriveLastMessagePreview = (content?: string, images?: string[]) => {
  if (content && content.trim()) {
    return content.trim();
  }

  if (images && images.length > 0) {
    return '[图片]';
  }

  return '';
};

const normalizeMessage = (message: MessageItem): ChatConversationMessage => ({
  id: message._id,
  role: message.role,
  content: message.content,
  images: message.images ?? [],
  createdAt: message.createdAt,
  metadata: message.metadata ?? undefined,
});

const normalizeMessageList = (messages: MessageItem[]): ChatConversationMessage[] => {
  const cloned = [...messages];
  cloned.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });
  return cloned.map(normalizeMessage);
};

const getSessionTimeValue = (session: SessionItem): number => {
  const timeSource = session.updatedAt || session.lastMessageAt || session.createdAt;
  if (!timeSource) {
    return 0;
  }
  const time = new Date(timeSource).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortSessionList = (sessions: SessionItem[]): SessionItem[] => {
  return [...sessions].sort((a, b) => {
    const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
    if (pinDiff !== 0) {
      return pinDiff;
    }
    return getSessionTimeValue(b) - getSessionTimeValue(a);
  });
};


const ChatPage: React.FC = () => {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const { user, fetchCurrentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [initializing, setInitializing] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionPage, setSessionPage] = useState(1);
  const [hasMoreSessions, setHasMoreSessions] = useState(true);

  const [messages, setMessages] = useState<ChatConversationMessage[]>([]);
  const [messagesCursor, setMessagesCursor] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [renaming, setRenaming] = useState(false);

  const sessionLoadingRef = useRef(false);
  const lastLoadedSessionRef = useRef<string | null>(null);
  const skipNextFetchRef = useRef(false);
  const sessionIdFromUrl = searchParams.get('sessionId');

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await fetchCurrentUser();
      } catch (error) {
        if ((error as Error)?.message !== 'UNAUTHORIZED') {
          console.warn('获取用户信息失败：', error);
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    init().catch((error) => console.error(error));

    return () => {
      mounted = false;
    };
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!initializing && !user) {
      navigate('/login', { replace: true, state: { from: '/chat' } });
    }
  }, [initializing, navigate, user]);

  const fetchSessions = useCallback(
    async (page = 1, append = false) => {
      if (sessionLoadingRef.current) {
        return;
      }

      sessionLoadingRef.current = true;
      setSessionLoading(true);
      try {
        const response = await listSessions({ page, limit: SESSION_PAGE_SIZE });
        const items = response.data;
        setSessions((prev) => {
          if (append) {
            const merged = [...prev];
            items.forEach((item) => {
              if (!merged.find((existing) => existing._id === item._id)) {
                merged.push(item);
              }
            });
            return sortSessionList(merged);
          }
          return sortSessionList(items);
        });

        setSessionPage(page);
        setHasMoreSessions(items.length === SESSION_PAGE_SIZE);
      } catch (error) {
        console.error(error);
        message.error('获取历史记录失败');
      } finally {
        setSessionLoading(false);
        sessionLoadingRef.current = false;
      }
    },
    [message],
  );

  const fetchMessagesForSession = useCallback(
    async (sessionId: string) => {
      setMessagesLoading(true);
      try {
        const response = await listMessages({
          sessionId,
          limit: MESSAGE_PAGE_SIZE,
        });
        const items = normalizeMessageList(response.data);
        setMessages(items);
        setHasMoreMessages(response.data.length === MESSAGE_PAGE_SIZE);
        setMessagesCursor(items[0]?.createdAt ?? null);
      } catch (error) {
        console.error(error);
        message.error('获取消息失败');
      } finally {
        setMessagesLoading(false);
      }
    },
    [message],
  );

  const loadMoreMessages = useCallback(async () => {
    if (
      !sessionIdFromUrl ||
      !hasMoreMessages ||
      !messagesCursor ||
      messagesLoadingMore
    ) {
      return;
    }

    setMessagesLoadingMore(true);
    try {
      const response = await listMessages({
        sessionId: sessionIdFromUrl,
        limit: MESSAGE_PAGE_SIZE,
        before: messagesCursor,
      });
      const items = normalizeMessageList(response.data);
      setMessages((prev) => [...items, ...prev]);
      if (response.data.length < MESSAGE_PAGE_SIZE) {
        setHasMoreMessages(false);
      }
      if (items.length > 0) {
        setMessagesCursor(items[0].createdAt ?? messagesCursor);
      }
    } catch (error) {
      console.error(error);
      message.error('加载更多消息失败');
    } finally {
      setMessagesLoadingMore(false);
    }
  }, [sessionIdFromUrl, hasMoreMessages, message, messagesCursor, messagesLoadingMore]);

  useEffect(() => {
    if (!user) {
      return;
    }
    void fetchSessions(1, false);
  }, [fetchSessions, user]);

  const handleLoadMoreSessions = useCallback(() => {
    if (!hasMoreSessions || sessionLoadingRef.current) return;
    const nextPage = sessionPage + 1;
    void fetchSessions(nextPage, true);
  }, [fetchSessions, hasMoreSessions, sessionPage]);

  const updateSessionQuery = useCallback(
    (sessionId: string | null, options?: { replace?: boolean }) => {
      const nextParams = new URLSearchParams(searchParams);
      if (sessionId) {
        nextParams.set('sessionId', sessionId);
      } else {
        nextParams.delete('sessionId');
      }
      setSearchParams(nextParams, { replace: options?.replace });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (!sessionIdFromUrl) {
      lastLoadedSessionRef.current = null;
      setMessages([]);
      setMessagesCursor(null);
      setHasMoreMessages(false);
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      lastLoadedSessionRef.current = sessionIdFromUrl;
      return;
    }

    if (lastLoadedSessionRef.current === sessionIdFromUrl) {
      return;
    }

    setMessages([]);
    setMessagesCursor(null);
    setHasMoreMessages(false);
    lastLoadedSessionRef.current = sessionIdFromUrl;
    void fetchMessagesForSession(sessionIdFromUrl);
  }, [sessionIdFromUrl, fetchMessagesForSession]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === sessionIdFromUrl) {
        return;
      }

      setMessages([]);
      setMessagesCursor(null);
      setHasMoreMessages(false);
      updateSessionQuery(sessionId);
    },
    [sessionIdFromUrl, updateSessionQuery],
  );

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setMessagesCursor(null);
    setHasMoreMessages(false);
    updateSessionQuery(null);
  }, [updateSessionQuery]);

  const refreshSessionSnippet = useCallback(
    (sessionId: string, content?: string, images?: string[]) => {
      setSessions((prev) => {
        const next = [...prev];
        const index = next.findIndex((item) => item._id === sessionId);
        const now = new Date().toISOString();
        if (index === -1) {
          next.unshift({
            _id: sessionId,
            title: deriveSessionTitle(content),
            status: 'active',
            lastMessage: deriveLastMessagePreview(content, images),
            lastMessageAt: now,
            createdAt: now,
            updatedAt: now,
            pinned: false,
          });
          return sortSessionList(next);
        }

        const target = next[index];
        next.splice(index, 1);
        next.unshift({
          ...target,
          lastMessage: deriveLastMessagePreview(content, images),
          lastMessageAt: now,
          updatedAt: now,
        });
        return sortSessionList(next);
      });
    },
    [],
  );

  const handleSessionCreated = useCallback(
    (session: SessionItem) => {
      setSessions((prev) =>
        sortSessionList([session, ...prev.filter((item) => item._id !== session._id)]),
      );
      skipNextFetchRef.current = true;
      lastLoadedSessionRef.current = session._id;
      updateSessionQuery(session._id);
    },
    [updateSessionQuery],
  );

  const handleMessagesChange = useCallback(
    (next: ChatConversationMessage[]) => {
      setMessages(next);
      if (next.length === 0) {
        setMessagesCursor(null);
        return;
      }

      setMessagesCursor(next[0]?.createdAt ?? null);

      const targetSessionId = sessionIdFromUrl ?? lastLoadedSessionRef.current;
      if (!targetSessionId) {
        return;
      }

      const latest = next[next.length - 1];
      if (!latest) {
        return;
      }

      let summaryContent = latest.content;
      let summaryImages = latest.images ?? [];

      if (
        latest.role === 'assistant' &&
        (!summaryContent || summaryContent.trim().length === 0) &&
        summaryImages.length === 0
      ) {
        for (let index = next.length - 1; index >= 0; index -= 1) {
          const item = next[index];
          if (item.role === 'user') {
            if (!summaryContent) {
              summaryContent = item.content;
            }
            if (summaryImages.length === 0 && item.images && item.images.length > 0) {
              summaryImages = item.images;
            }
            break;
          }
        }
      }

      refreshSessionSnippet(targetSessionId, summaryContent, summaryImages);
      lastLoadedSessionRef.current = targetSessionId;
    },
    [refreshSessionSnippet, sessionIdFromUrl],
  );

  const handleTogglePin = useCallback(
    async (sessionId: string, targetPinned: boolean) => {
      try {
        await updateSession(sessionId, { pinned: targetPinned });
        setSessions((prev) =>
          sortSessionList(
            prev.map((item) =>
              item._id === sessionId
                ? {
                    ...item,
                    pinned: targetPinned,
                  }
                : item,
            ),
          ),
        );
        message.success(targetPinned ? '已固定到顶部' : '已取消固定');
      } catch (error) {
        console.error(error);
        message.error('操作失败，请稍后重试');
      }
    },
    [message],
  );

  const handleHistoryMenuAction = useCallback(
    (session: SessionItem, action: HistoryAction) => {
      if (action === 'rename') {
        setRenameTargetId(session._id);
        setRenameInputValue(session.title ?? '');
        setRenameModalOpen(true);
        return;
      }
      if (action === 'delete') {
        Modal.confirm({
          title: '删除对话',
          content: '确认删除该对话及其所有消息？操作无法撤销。',
          okText: '删除',
          cancelText: '取消',
          okButtonProps: { danger: true },
          onOk: async () => {
            try {
              await removeSession(session._id);
              setSessions((prev) => sortSessionList(prev.filter((item) => item._id !== session._id)));
              if (session._id === sessionIdFromUrl) {
                updateSessionQuery(null);
                setMessages([]);
                setMessagesCursor(null);
                setHasMoreMessages(false);
              }
              message.success('对话已删除');
            } catch (error) {
              console.error(error);
              message.error('删除失败，请稍后重试');
              throw error;
            }
          },
        });
        return;
      }
      if (action === 'pin' || action === 'unpin') {
        void handleTogglePin(session._id, action === 'pin');
      }
    },
    [handleTogglePin, message, sessionIdFromUrl, updateSessionQuery],
  );

  if (initializing || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spin size="large" tip="加载中" />
      </div>
    );
  }

  return (
    <>
      <div className="flex" style={{ height: 'calc(100vh - 150px)' }}>
        <HistoryPanel
          sessions={sessions}
          activeSessionId={sessionIdFromUrl}
          loading={sessionLoading}
          hasMore={hasMoreSessions}
          onLoadMore={handleLoadMoreSessions}
          onSelect={handleSelectSession}
          onNewSession={handleNewConversation}
          onMenuAction={handleHistoryMenuAction}
        />

        <div className="flex flex-1 flex-col">
          <ChatConversation
            sessionId={sessionIdFromUrl ?? undefined}
            messages={messages}
            loading={messagesLoading}
            hasMoreMessages={hasMoreMessages}
            loadingMoreMessages={messagesLoadingMore}
            onLoadMoreMessages={loadMoreMessages}
            onMessagesChange={handleMessagesChange}
            onSessionCreate={handleSessionCreated}
          />
      </div>
    </div>
      <Modal
        title="修改名称"
        open={renameModalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={renaming}
        onOk={async () => {
          const targetId = renameTargetId;
          const nextTitle = renameInputValue.trim();
          if (!targetId) {
            setRenameModalOpen(false);
            return;
          }
          if (!nextTitle) {
            message.warning('名称不能为空');
            return;
          }
          try {
            setRenaming(true);
            await updateSession(targetId, { title: nextTitle });
            setSessions((prev) =>
              sortSessionList(
                prev.map((item) =>
                  item._id === targetId
                    ? {
                        ...item,
                        title: nextTitle,
                      }
                    : item,
                ),
              ),
            );
            message.success('名称已更新');
            setRenameModalOpen(false);
            setRenameTargetId(null);
            setRenameInputValue('');
          } catch (error) {
            console.error(error);
            message.error('修改名称失败，请稍后再试');
          } finally {
            setRenaming(false);
          }
        }}
        onCancel={() => {
          setRenameModalOpen(false);
          setRenaming(false);
          setRenameTargetId(null);
          setRenameInputValue('');
        }}
      >
        <Input
          value={renameInputValue}
          onChange={(event) => setRenameInputValue(event.target.value)}
          maxLength={60}
          placeholder="请输入新的对话名称"
        />
      </Modal>
    </>
  );
};

export default ChatPage;
