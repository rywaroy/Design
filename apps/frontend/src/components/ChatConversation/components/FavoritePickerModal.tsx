import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Empty, Modal, Segmented, Spin } from 'antd';
import type { SegmentedValue } from 'antd/es/segmented';
import { getFavoriteScreens } from '../../../services/favorite';
import type { ScreenListItem } from '../../../services/screen';
import type { Platform } from '@design/shared-types';
import { resolveAssetUrl } from '../../../lib/asset';
import ScreenCard from '../../ScreenCard';

export interface FavoritePickerModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (items: { id: string; url: string }[]) => void;
  // how many more images can be added
  remaining: number;
  // existing image URLs in the composer (to avoid duplicates)
  existingUrls?: string[];
}

interface ScreenItemEntry {
  id: string;
  url: string;
  platform: Platform;
  isFavorite: boolean;
}

const PAGE_SIZE = 30;

const resolveScreenCoverUrl = (screen: ScreenListItem): string | undefined => {
  const primary = (screen as any).url ?? screen.originalUrl;
  const resolvedPrimary = resolveAssetUrl(primary) ?? primary ?? undefined;
  if (resolvedPrimary) {
    return resolvedPrimary;
  }
  if (screen.originalUrl) {
    const resolvedOriginal = resolveAssetUrl(screen.originalUrl) ?? screen.originalUrl;
    if (resolvedOriginal) {
      return resolvedOriginal;
    }
  }
  return undefined;
};

const FavoritePickerModal: React.FC<FavoritePickerModalProps> = ({
  open,
  onCancel,
  onConfirm,
  remaining,
  existingUrls = [],
}) => {
  const { message } = App.useApp();
  const [platform, setPlatform] = useState<Platform>('ios');
  const [items, setItems] = useState<ScreenItemEntry[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedEntriesMap, setSelectedEntriesMap] = useState<Record<string, ScreenItemEntry>>({});
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  const existingSet = useMemo(() => new Set(existingUrls), [existingUrls]);

  const loadPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      // strong guard against concurrent calls (state may be stale in sync)
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const reqId = ++requestIdRef.current;
        const res = await getFavoriteScreens({ page: targetPage, pageSize: PAGE_SIZE, platform });
        const data = res.data;
        // ignore outdated responses
        if (reqId !== requestIdRef.current) {
          return;
        }
        const pageItems: ScreenItemEntry[] = (data.items || [])
          .map((screen) => {
            const url = resolveScreenCoverUrl(screen);
            if (!url) return null;
            return {
              id: screen.screenId,
              url,
              platform: (screen.platform as Platform) ?? platform,
              isFavorite: Boolean(screen.isFavorite ?? true),
            };
          })
          .filter((x): x is ScreenItemEntry => Boolean(x));

        // some backends may return page starting from 0/1 or omit it; be defensive
        const returnedPage = data.page;
        const resolvedPage = Math.max(returnedPage ?? targetPage, targetPage);

        // merge list and compute derived states based on merged result
        setItems((prev) => {
          const merged = replace ? pageItems : [...prev, ...pageItems];
          const totalCount = typeof data.total === 'number' ? data.total : merged.length;
          setTotal(totalCount);
          setPage(resolvedPage);
          const hasMoreByTotal = typeof data.total === 'number' ? resolvedPage * PAGE_SIZE < totalCount : undefined;
          const nextHasMore =
            typeof hasMoreByTotal === 'boolean'
              ? hasMoreByTotal && pageItems.length > 0
              : pageItems.length === PAGE_SIZE;
          setHasMore(nextHasMore);
          setSelectedEntriesMap((prevMap) => {
            let changed = false;
            const nextMap: Record<string, ScreenItemEntry> = { ...prevMap };
            for (const item of merged) {
              if (nextMap[item.id] && nextMap[item.id] !== item) {
                nextMap[item.id] = item;
                changed = true;
              }
            }
            return changed ? nextMap : prevMap;
          });
          return merged;
        });
      } catch (err) {
        // ignore silently, show a toast
        message.error('加载收藏失败，请稍后重试');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [message, platform],
  );

  useEffect(() => {
    if (!open) return;
    // reset state when opened or platform changed
    setItems([]);
    setPage(0);
    setTotal(0);
    setHasMore(true);
    requestIdRef.current = 0;
    loadingRef.current = false;
    void loadPage(1, true);
  }, [open, loadPage, platform]);

  // pull-up load using scroll listener only (avoid sentinel always intersecting)
  useEffect(() => {
    if (!open) return;
    const root = scrollRootRef.current;
    if (!root) return;
    const onScroll = () => {
      if (!hasMore || loadingRef.current) return;
      const { scrollTop, clientHeight, scrollHeight } = root;
      if (scrollTop <= 0) return; // require user scrolls down
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        void loadPage(page + 1, false);
      }
    };
    root.addEventListener('scroll', onScroll);
    return () => root.removeEventListener('scroll', onScroll);
  }, [open, hasMore, loadPage, page]);

  const handlePlatformChange = (value: SegmentedValue) => {
    const next = value as Platform;
    if (next === platform) return;
    setPlatform(next);
  };

  const selectedCount = selectedIds.size;
  const toggleSelect = (entry: ScreenItemEntry) => {
    if (existingSet.has(entry.url)) {
      message.info('该图片已在上传列表');
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entry.id)) {
        next.delete(entry.id);
        setSelectedEntriesMap((prevMap) => {
          const { [entry.id]: _removed, ...rest } = prevMap;
          return rest;
        });
        return next;
      }
      if (next.size >= remaining) {
        message.warning(`最多选择 ${remaining} 张`);
        return next;
      }
      next.add(entry.id);
      setSelectedEntriesMap((prevMap) => ({
        ...prevMap,
        [entry.id]: entry,
      }));
      return next;
    });
  };

  const selectedEntries = useMemo(() => {
    if (selectedIds.size === 0) return [] as ScreenItemEntry[];
    return Array.from(selectedIds)
      .map((id) => selectedEntriesMap[id] ?? items.find((i) => i.id === id))
      .filter((x): x is ScreenItemEntry => Boolean(x));
  }, [items, selectedEntriesMap, selectedIds]);

  useEffect(() => {
    if (selectedIds.size === 0) return;
    const toRemove: string[] = [];
    selectedIds.forEach((id) => {
      const record = selectedEntriesMap[id];
      if (record && existingSet.has(record.url)) {
        toRemove.push(id);
      }
    });
    if (toRemove.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      toRemove.forEach((id) => next.delete(id));
      return next;
    });
    setSelectedEntriesMap((prevMap) => {
      const nextMap: Record<string, ScreenItemEntry> = { ...prevMap };
      let changed = false;
      toRemove.forEach((id) => {
        if (nextMap[id]) {
          delete nextMap[id];
          changed = true;
        }
      });
      return changed ? nextMap : prevMap;
    });
  }, [existingSet, selectedEntriesMap, selectedIds]);

  const handleOk = () => {
    if (selectedEntries.length === 0) {
      onCancel();
      return;
    }
    // filter out duplicates once more
    const toAdd = selectedEntries
      .filter((e) => !existingSet.has(e.url))
      .map((entry) => ({ id: entry.id, url: entry.url }));
    if (toAdd.length === 0) {
      onCancel();
      return;
    }
    onConfirm(toAdd);
  };

  const PLATFORM_OPTIONS: { label: string; value: Platform }[] = [
    { label: 'iOS', value: 'ios' },
    { label: 'Web', value: 'web' },
  ];

  const gridClassName = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6';

  return (
    <Modal
      open={open}
      title="选择收藏图片"
      onCancel={onCancel}
      onOk={handleOk}
      centered
      // @ts-expect-error 项目内约定：Modal 支持 center 属性强制居中
      center
      width="90vw"
      styles={{
        wrapper: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          width: '90vw',
          maxWidth: '90vw',
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          flex: 1,
          overflow: 'hidden',
          padding: 0,
        },
      }}
      destroyOnClose
      maskClosable={false}
    >
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <Segmented
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={handlePlatformChange}
            className="rounded-full border border-gray-200 bg-white shadow-sm"
          />
          <span className="text-sm text-gray-500">
            已选 {selectedCount} / 可选 {Math.max(0, remaining)}
          </span>
        </div>

        <div ref={scrollRootRef} className="mt-4 flex-1 overflow-auto">
          <div className="flex h-full flex-col gap-4 pb-6">
            {items.length === 0 && loading ? (
              <div className="flex min-h-[200px] flex-1 items-center justify-center">
                <Spin tip="加载收藏图片" />
              </div>
            ) : null}

            {items.length === 0 && !loading ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <Empty description="暂无收藏图片" />
              </div>
            ) : null}

            {items.length > 0 ? (
              <div className={`${gridClassName} flex-1 justify-items-center`}>
                {items.map((entry) => {
                  const selected = selectedIds.has(entry.id);
                  const isExisting = existingSet.has(entry.url);
                  const disabledByQuota = !selected && remaining <= selectedCount;
                  const disabled = isExisting || disabledByQuota;
                  const displaySelected = selected || isExisting;
                  const isWeb = entry.platform === 'web';
                  const colSpanClass = isWeb ? 'lg:col-span-4' : 'lg:col-span-3';
                  const cardVariant: 'ios' | 'web' = isWeb ? 'web' : 'ios';

                  const handleCardToggle = () => {
                    if (isExisting) {
                      return;
                    }
                    if (disabledByQuota && !selected) {
                      return;
                    }
                    toggleSelect(entry);
                  };

                  const handleKeyToggle = (event: React.KeyboardEvent<HTMLDivElement>) => {
                    if (isExisting) return;
                    if (disabledByQuota && !selected) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleSelect(entry);
                    }
                  };

                  return (
                    <div key={entry.id} className={`relative flex justify-center ${colSpanClass}`}>
                      <div
                        role="button"
                        tabIndex={isExisting ? -1 : 0}
                        aria-disabled={disabled}
                        className={`relative w-full max-w-[600px] ${
                          disabled
                            ? isExisting
                              ? 'cursor-not-allowed'
                              : 'cursor-not-allowed opacity-60'
                            : 'cursor-pointer'
                        }`}
                        onClick={handleCardToggle}
                        onKeyDown={handleKeyToggle}
                      >
                        <ScreenCard
                          coverUrl={entry.url}
                          fallbackText="暂无预览"
                          variant={cardVariant}
                          selected={displaySelected}
                          isFavorite={entry.isFavorite}
                          className="transition-transform duration-200"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {loading ? (
              <div className="flex justify-center py-3">
                <Spin size="small" tip="加载中" />
              </div>
            ) : null}
            {!hasMore && items.length > 0 ? (
              <p className="py-3 text-center text-sm text-gray-400">已经到底啦</p>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FavoritePickerModal;
