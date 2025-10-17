import React, { useEffect, useRef } from 'react';
import { Button, Dropdown, Empty, MenuProps, Spin, Typography } from 'antd';
import { EllipsisOutlined, PlusCircleOutlined, PushpinOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { SessionItem } from '../../../../services/chat';

const { Title, Text } = Typography;

export type HistoryAction = 'delete' | 'pin' | 'unpin' | 'rename';

export interface HistoryPanelProps {
  sessions: SessionItem[];
  activeSessionId?: string | null;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
  onMenuAction?: (session: SessionItem, action: HistoryAction) => void;
  className?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  sessions,
  activeSessionId,
  loading,
  hasMore,
  onLoadMore,
  onSelect,
  onNewSession,
  onMenuAction,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasMore || !onLoadMore) return;

    const handleScroll = () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 80) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, onLoadMore]);

  return (
    <div className={`flex w-70 mr-4 flex-col border border-gray-200 bg-[#f7f8fb] rounded-3xl ${className ?? ''}`}>
      <div className="px-6 pt-6 pb-3">
        <Title level={4} className="!m-0 !text-base text-gray-900">
          历史记录
        </Title>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6" ref={containerRef}>
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          block
          className="!mb-4 rounded-xl"
          onClick={() => onNewSession?.()}
        >
          新建对话
        </Button>

        {sessions.length === 0 && !loading ? (
          <div className="mt-12">
            <Empty description="暂无历史记录" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => {
              const active = session._id === activeSessionId;
              const pinKey: 'pin' | 'unpin' = session.pinned ? 'unpin' : 'pin';
              const menuItems: MenuProps['items'] = [
                { key: 'rename', label: '修改名称', icon: <EditOutlined /> },
                { key: pinKey, label: session.pinned ? '取消固定' : '固定对话', icon: <PushpinOutlined /> },
                { key: 'delete', danger: true, label: '删除对话', icon: <DeleteOutlined /> },
              ];

              const baseClasses =
                'group relative flex items-center justify-between rounded-sm pl-4 pr-2 py-1 transition-colors cursor-pointer';
              const activeClasses = active ? 'bg-[#e4e6eb] text-gray-900' : 'text-gray-900 hover:bg-[#e4e6eb]';
              const iconWrapperClasses = session.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';

              const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
                domEvent.stopPropagation();
                const action = key as HistoryAction;
                onMenuAction?.(session, action);
              };

              return (
                <div
                  key={session._id}
                  onClick={() => onSelect?.(session._id)}
                  className={`${baseClasses} ${activeClasses}`}
                >
                  <Text className="max-w-[200px] truncate text-sm font-medium" title={session.title}>
                    {session.title}
                  </Text>
                  <Dropdown trigger={['click']} menu={{ items: menuItems, onClick: handleMenuClick }}>
                    <div
                      className={`relative flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-opacity duration-150 ${iconWrapperClasses}`}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      {session.pinned ? (
                        <>
                          <span className="pointer-events-none transition-opacity duration-150 group-hover:opacity-0">
                            <PushpinOutlined />
                          </span>
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <EllipsisOutlined />
                          </span>
                        </>
                      ) : (
                        <EllipsisOutlined className="pointer-events-none" />
                      )}
                    </div>
                  </Dropdown>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-center py-4">
                <Spin size="small" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
