import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { message, Modal, Spin, Empty } from 'antd';
import { CloseCircleFilled, SearchOutlined } from '@ant-design/icons';
import type { ProjectPlatform } from '../../../../services/project';
import type { ScreenListItem } from '../../../../services/screen';
import { searchScreensWithAI } from '../../../../services/screen';
import ScreenCard from '../../../../components/ScreenCard';
import { resolveAssetUrl } from '../../../../lib/asset';
import type { ScreenPreviewItem } from '../../../../components/ImagePreviewModal';

const resolveScreenCoverUrl = (screen: ScreenListItem): string | undefined => {
  const candidates = [screen.url, screen.originalUrl];
  for (const candidate of candidates) {
    if (candidate) {
      const resolved = resolveAssetUrl(candidate) ?? candidate;
      if (resolved) {
        return resolved;
      }
    }
  }
  return undefined;
};

interface AISearchProps {
  open: boolean;
  platform: ProjectPlatform;
  onClose: () => void;
  onToggleFavorite: (screenId: string, nextFavorite: boolean) => Promise<void> | void;
  favoritePending: Record<string, boolean>;
}

const AISearch: React.FC<AISearchProps> = ({
  open,
  platform,
  onClose,
  onToggleFavorite,
  favoritePending,
}) => {
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [screens, setScreens] = useState<ScreenListItem[]>([]);
  const [previewData, setPreviewData] = useState<{ screens: ScreenPreviewItem[]; indexMap: Map<string, number> }>({
    screens: [],
    indexMap: new Map(),
  });
  const [searched, setSearched] = useState(false);

  const gridClassName = useMemo(() => {
    const baseClass = 'grid grid-cols-1 gap-6 sm:grid-cols-2';
    return platform === 'ios' ? `${baseClass} lg:grid-cols-5` : `${baseClass} lg:grid-cols-6`;
  }, [platform]);

  useEffect(() => {
    if (!open) {
      setRequirement('');
      setScreens([]);
      setPreviewData({ screens: [], indexMap: new Map() });
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleRequirementChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRequirement(event.target.value);
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = requirement.trim();
    if (!trimmed) {
      void message.warning('请输入需求描述后再执行 AI 搜索');
      return;
    }

    setSearched(true);
    setLoading(true);
    try {
      const response = await searchScreensWithAI({
        requirement: trimmed,
        platform,
      });
      const { search } = response.data;
      const items = search.items ?? [];
      setScreens(items);
      const nextIndexMap = new Map<string, number>();
      const nextScreens: ScreenPreviewItem[] = [];
      items.forEach((item) => {
        const url = resolveScreenCoverUrl(item);
        if (!url) {
          return;
        }
        nextIndexMap.set(item.screenId, nextScreens.length);
        nextScreens.push({
          ...item,
          previewUrl: url,
        });
      });
      setPreviewData({ screens: nextScreens, indexMap: nextIndexMap });
    } catch (err) {
      console.error('AI 搜索页面失败', err);
      setScreens([]);
      setPreviewData({ screens: [], indexMap: new Map() });
    } finally {
      setLoading(false);
    }
  }, [platform, requirement]);

  const handlePressEnter = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      if (!loading) {
        void handleSearch();
      }
    },
    [handleSearch, loading],
  );

  const handleFavoriteToggle = useCallback(
    async (screenId: string, nextFavorite: boolean) => {
      await onToggleFavorite(screenId, nextFavorite);
      setScreens((prev) =>
        prev.map((screen) =>
          screen.screenId === screenId ? { ...screen, isFavorite: nextFavorite } : screen,
        ),
      );
      setPreviewData((prev) => ({
        screens: prev.screens.map((screen) =>
          screen.screenId === screenId ? { ...screen, isFavorite: nextFavorite } : screen,
        ),
        indexMap: prev.indexMap,
      }));
    },
    [onToggleFavorite],
  );

  return (
    <Modal
      open={open}
      title={null}
      closable={false}
      onCancel={handleClose}
      footer={null}
      width={1100}
      maskClosable={!loading}
      className="screen-ai-search-modal"
      styles={{
        mask: {
          backdropFilter: 'blur(14px)',
        },
        body: {
          padding: 0,
        },
        content: {
          background: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <div className="pointer-events-auto flex justify-center">
        <div className="w-full max-w-[1100px] overflow-hidden rounded-3xl bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5">
          <div className="flex items-center gap-4 px-6 py-4 border-b border-white/60">
            <span className="text-xl text-gray-400">
              <SearchOutlined />
            </span>
            <input
              value={requirement}
              onChange={handleRequirementChange}
              onKeyDown={handlePressEnter}
              placeholder="输入你的需求让 AI 推荐相关页面，例如：寻找一款音乐播放器的设置页面"
              disabled={loading}
              className="w-full border-none bg-transparent text-lg text-gray-700 placeholder:text-gray-400 outline-none focus:outline-none"
              autoFocus
            />
            {requirement ? (
              <button
                type="button"
                onClick={() => setRequirement('')}
                className="cursor-pointer !text-gray-400 transition"
                aria-label="清空输入"
              >
                <CloseCircleFilled />
              </button>
            ) : null}
          </div>
          {loading || searched ? (
            <div className="max-h-[520px] overflow-y-auto px-8 pb-8 pt-6 border-t border-gray-300">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spin tip="AI 搜索中" />
                </div>
              ) : screens.length > 0 ? (
                <div className={gridClassName}>
                  {screens.map((screen) => {
                    const coverUrl = resolveScreenCoverUrl(screen);
                    const isWeb = screen.platform === 'web' || platform === 'web';
                    const variant: 'ios' | 'web' = isWeb ? 'web' : 'ios';
                    const cardClassName = isWeb
                      ? 'lg:col-span-3'
                      : platform === 'ios'
                        ? 'lg:col-span-1'
                        : 'lg:col-span-2';
                    const previewEntryIndex = previewData.indexMap.get(screen.screenId);
                    const previewConfig =
                      previewData.screens.length > 0
                        ? {
                            screens: previewData.screens,
                            initialIndex:
                              typeof previewEntryIndex === 'number' ? previewEntryIndex : undefined,
                          }
                        : undefined;

                    return (
                      <ScreenCard
                        key={`ai-${screen.screenId}`}
                        coverUrl={coverUrl}
                        fallbackText="暂无预览"
                        variant={variant}
                        className={cardClassName}
                        isFavorite={screen.isFavorite ?? false}
                        favoritePending={Boolean(favoritePending[screen.screenId])}
                        onToggleFavorite={(next) => {
                          void handleFavoriteToggle(screen.screenId, next);
                        }}
                        isRecommended={Boolean(screen.isRecommended || screen.isAiRecommended)}
                        preview={previewConfig}
                      />
                    );
                  })}
                </div>
              ) : (
                <Empty description="AI 暂未找到匹配页面" className="py-16" />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export default AISearch;
