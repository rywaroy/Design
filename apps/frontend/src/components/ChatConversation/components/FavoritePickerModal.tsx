import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Empty, Image, Modal, Segmented, Spin } from 'antd';
import type { SegmentedValue } from 'antd/es/segmented';
import { getFavoriteScreens } from '../../../services/favorite';
import type { ScreenListItem } from '../../../services/screen';
import type { Platform } from '@design/shared-types';
import { resolveAssetUrl } from '../../../lib/asset';

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
            return { id: screen.screenId, url };
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
    setSelectedIds(new Set());
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
  const canSelectMore = Math.max(0, remaining - selectedCount);

  const toggleSelect = (entry: ScreenItemEntry) => {
    if (existingSet.has(entry.url)) {
      message.info('该图片已在上传列表');
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entry.id)) {
        next.delete(entry.id);
        return next;
      }
      if (next.size >= remaining) {
        message.warning(`最多选择 ${remaining} 张`);
        return next;
      }
      next.add(entry.id);
      return next;
    });
  };

  const selectedEntries = useMemo(() => {
    if (selectedIds.size === 0) return [] as ScreenItemEntry[];
    const map = new Map(items.map((i) => [i.id, i] as const));
    return Array.from(selectedIds)
      .map((id) => map.get(id))
      .filter((x): x is ScreenItemEntry => Boolean(x));
  }, [items, selectedIds]);

  const handleOk = () => {
    if (selectedEntries.length === 0) {
      onCancel();
      return;
    }
    // filter out duplicates once more
    const toAdd = selectedEntries.filter((e) => !existingSet.has(e.url));
    onConfirm(toAdd);
  };

  const PLATFORM_OPTIONS: { label: string; value: Platform }[] = [
    { label: 'iOS', value: 'ios' },
    { label: 'Web', value: 'web' },
  ];

  return (
    <Modal
      open={open}
      title="选择收藏图片"
      onCancel={onCancel}
      onOk={handleOk}
      okText={selectedEntries.length > 0 ? `加入（${selectedEntries.length}）` : '加入'}
      width="90vw"
      style={{ top: '5vh' }}
      bodyStyle={{ maxHeight: '80vh', overflow: 'hidden', padding: 0 }}
      destroyOnClose
      maskClosable={false}
    >
      <div ref={scrollRootRef} style={{ maxHeight: '80vh', overflow: 'auto' }}>
        <div className="flex flex-col gap-4 p-6">
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

        {items.length === 0 && loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spin tip="加载收藏图片" />
          </div>
        ) : null}

        {items.length === 0 && !loading ? (
          <Empty description="暂无收藏图片" className="py-16" />
        ) : null}

          {items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {items.map((entry) => {
                const selected = selectedIds.has(entry.id);
                const disabled = existingSet.has(entry.url) || (!selected && remaining <= selectedCount);
                return (
                  <div
                    key={entry.id}
                    className={`group relative h-36 w-full overflow-hidden rounded-xl border ${
                      selected ? 'border-black' : 'border-gray-200'
                    } ${disabled ? 'opacity-70' : 'cursor-pointer'}`}
                    onClick={() => toggleSelect(entry)}
                    role="button"
                    aria-label={selected ? '取消选择图片' : '选择图片'}
                  >
                    <Image src={entry.url} alt="收藏图片" className="object-cover" height={144} width={256} preview={false} />
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
    </Modal>
  );
};

export default FavoritePickerModal;
