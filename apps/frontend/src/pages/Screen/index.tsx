import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { FloatButton, Badge, Button, Empty, Segmented, Spin } from 'antd';
import type { SegmentedValue } from 'antd/es/segmented';
import { FilterOutlined, OpenAIOutlined } from '@ant-design/icons';
import ScreenCard from '../../components/ScreenCard';
import FilterModal, { type FilterFieldConfig, type FilterSelectionState } from '../../components/FilterModal';
import type { ScreenListItem, ScreenSearchParams } from '../../services/screen';
import { getScreenFilters, searchScreens } from '../../services/screen';
import type { ProjectPlatform } from '../../services/project';
import { favoriteScreen, unfavoriteScreen } from '../../services/favorite';
import { resolveAssetUrl } from '../../lib/asset';
import type { ScreenPreviewItem } from '../../components/ImagePreviewModal';
import {
  SCREEN_FILTER_FIELDS,
  createInitialFilterSelection,
  findFieldConfig,
  type ScreenFilterDatasetKey,
  type ScreenFilterSelectionState,
} from '../../constants/screenFilters';
import AISearch from './components/AISearch';

const PAGE_SIZE = 30;

const BackTop = FloatButton.BackTop;

const platformOptions: { label: string; value: ProjectPlatform }[] = [
  { label: 'iOS', value: 'ios' },
  { label: 'Web', value: 'web' },
];

interface ScreenListState {
  items: ScreenListItem[];
  currentPage: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
}

const createInitialScreenState = (): ScreenListState => ({
  items: [],
  currentPage: 0,
  total: 0,
  hasMore: true,
  loading: false,
});

const createInitialPrimaryOptions = () =>
  SCREEN_FILTER_FIELDS.reduce<Record<ScreenFilterDatasetKey, string[]>>((acc, field) => {
    acc[field.datasetKey] = [];
    return acc;
  }, {} as Record<ScreenFilterDatasetKey, string[]>);

const createInitialChildrenOptions = () =>
  SCREEN_FILTER_FIELDS.reduce<Record<ScreenFilterDatasetKey, Record<string, string[]>>>(
    (acc, field) => {
      acc[field.datasetKey] = {};
      return acc;
    },
    {} as Record<ScreenFilterDatasetKey, Record<string, string[]>>,
  );

const mergeScreens = (
  prevItems: ScreenListItem[],
  nextItems: ScreenListItem[],
  replace?: boolean,
) => {
  if (replace) {
    return nextItems;
  }

  const indexMap = new Map<string, number>();
  const merged = [...prevItems];

  prevItems.forEach((item, index) => {
    indexMap.set(item.screenId, index);
  });

  nextItems.forEach((item) => {
    const existingIndex = indexMap.get(item.screenId);
    if (typeof existingIndex === 'number') {
      merged[existingIndex] = item;
    } else {
      indexMap.set(item.screenId, merged.length);
      merged.push(item);
    }
  });

  return merged;
};

const resolveScreenCoverUrl = (screen: ScreenListItem): string | undefined => {
  const primary = screen.url ?? screen.originalUrl;
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

const ScreenListPage: FC = () => {
  const [platform, setPlatform] = useState<ProjectPlatform>('ios');
  const [screenState, setScreenState] = useState<ScreenListState>(createInitialScreenState);
  const [favoritePending, setFavoritePending] = useState<Record<string, boolean>>({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [primaryFilterOptions, setPrimaryFilterOptions] = useState<
    Record<ScreenFilterDatasetKey, string[]>
  >(createInitialPrimaryOptions);
  const [childrenFilterOptions, setChildrenFilterOptions] = useState<
    Record<ScreenFilterDatasetKey, Record<string, string[]>>
  >(createInitialChildrenOptions);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ScreenFilterSelectionState>(
    createInitialFilterSelection(),
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const backTopTarget = useCallback(() => window, []);
  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      SCREEN_FILTER_FIELDS.map((field) => ({
        key: field.datasetKey,
        label: field.label,
        multiple: field.multiple,
      })),
    [],
  );

  const convertFiltersToParams = useCallback(
    (selection: ScreenFilterSelectionState): Partial<ScreenSearchParams> => {
      const params: Partial<ScreenSearchParams> = {};
      SCREEN_FILTER_FIELDS.forEach((field) => {
        const values = selection[field.datasetKey] ?? [];
        if (!values || values.length === 0) {
          return;
        }
        if (field.multiple) {
          (params as Record<string, unknown>)[field.requestKey] = values;
        } else {
          (params as Record<string, unknown>)[field.requestKey] = values[0];
        }
      });
      return params;
    },
    [],
  );

  const fetchScreens = useCallback(
    async ({
      page,
      replace = false,
      filtersSelection,
    }: {
      page: number;
      replace?: boolean;
      filtersSelection?: ScreenFilterSelectionState;
    }) => {
      if (loadingRef.current && !replace) {
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      loadingRef.current = true;

      const selection = filtersSelection ?? appliedFilters;
      const filterParams = convertFiltersToParams(selection);

      setScreenState((prev) => ({
        ...prev,
        loading: true,
      }));

      try {
        const response = await searchScreens({
          page,
          pageSize: PAGE_SIZE,
          platform,
          ...filterParams,
        });
        if (requestId !== requestIdRef.current) {
          return;
        }

        const { items = [], total = 0, page: currentPage, pageSize } = response.data;
        const parsedPage = typeof currentPage === 'number' ? currentPage : page;
        const parsedPageSize =
          typeof pageSize === 'number' && pageSize > 0 ? pageSize : PAGE_SIZE;
        const totalCount = typeof total === 'number' ? total : Number(total ?? 0);

        setScreenState((prev) => ({
          items: mergeScreens(prev.items, items, replace),
          currentPage: parsedPage,
          total: totalCount,
          hasMore: parsedPage * parsedPageSize < totalCount && items.length > 0,
          loading: false,
        }));
      } catch (error) {
        console.error('加载页面列表失败', error);
        if (requestId === requestIdRef.current) {
          setScreenState((prev) => ({
            ...prev,
            loading: false,
          }));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
        }
      }
    },
    [appliedFilters, convertFiltersToParams, platform],
  );

  useEffect(() => {
    setScreenState(createInitialScreenState());
    setFavoritePending({});
    loadingRef.current = false;
    requestIdRef.current += 1;
    void fetchScreens({ page: 1, replace: true });
  }, [platform, fetchScreens]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) {
          return;
        }

        if (loadingRef.current || !screenState.hasMore) {
          return;
        }

        void fetchScreens({ page: screenState.currentPage + 1 });
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [fetchScreens, screenState.currentPage, screenState.hasMore]);

  useEffect(() => {
    let active = true;
    setFiltersLoading(true);
    getScreenFilters()
      .then((response) => {
        if (!active) {
          return;
        }
        const nextPrimary = createInitialPrimaryOptions();
        response.data.categories.forEach((category) => {
          const datasetKey = category.key as ScreenFilterDatasetKey;
          if (!findFieldConfig(datasetKey)) {
            return;
          }
          nextPrimary[datasetKey] = category.options ?? [];
        });
        setPrimaryFilterOptions(nextPrimary);
        setChildrenFilterOptions(createInitialChildrenOptions());
      })
      .catch((error) => {
        console.error('获取筛选项失败', error);
      })
      .finally(() => {
        if (active) {
          setFiltersLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handlePlatformChange = (value: SegmentedValue) => {
    const nextPlatform = value as ProjectPlatform;
    if (nextPlatform === platform) {
      return;
    }
    setPlatform(nextPlatform);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleScreenFavoriteToggle = useCallback(
    async (screenId: string, nextFavorite: boolean) => {
      setFavoritePending((prev) => ({
        ...prev,
        [screenId]: true,
      }));

      try {
        if (nextFavorite) {
          await favoriteScreen(screenId);
        } else {
          await unfavoriteScreen(screenId);
        }
        setScreenState((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.screenId === screenId ? { ...item, isFavorite: nextFavorite } : item,
          ),
        }));
      } catch (error) {
        console.error('更新页面收藏状态失败', error);
      } finally {
        setFavoritePending((prev) => {
          const nextState = { ...prev };
          delete nextState[screenId];
          return nextState;
        });
      }
    },
    [],
  );

  const handleFetchChildrenOptions = useCallback(
    async (dataset: ScreenFilterDatasetKey, parent: string) => {
      try {
        const response = await getScreenFilters({ category: dataset, parent });
        const options = response.data.categories[0]?.options ?? [];
        setChildrenFilterOptions((prev) => ({
          ...prev,
          [dataset]: {
            ...(prev[dataset] ?? {}),
            [parent]: options,
          },
        }));
        return options;
      } catch (error) {
        console.error('获取子筛选项失败', error);
        setChildrenFilterOptions((prev) => ({
          ...prev,
          [dataset]: {
            ...(prev[dataset] ?? {}),
            [parent]: [],
          },
        }));
        return [];
      }
    },
    [],
  );

  const activeFilterCount = useMemo(() => {
    return SCREEN_FILTER_FIELDS.reduce((count, field) => {
      const values = appliedFilters[field.datasetKey] ?? [];
      if (!values || values.length === 0) {
        return count;
      }
      return count + (field.multiple ? values.length : 1);
    }, 0);
  }, [appliedFilters]);

  const handleFilterApply = (selection: FilterSelectionState) => {
    const nextSelection = selection as ScreenFilterSelectionState;
    setAppliedFilters(nextSelection);
    setScreenState(createInitialScreenState());
    setFavoritePending({});
    loadingRef.current = false;
    requestIdRef.current += 1;
    void fetchScreens({ page: 1, replace: true, filtersSelection: nextSelection });
  };

  const handleModalClose = () => {
    setFilterModalOpen(false);
  };

  const handleAiModalOpen = () => {
    setAiModalOpen(true);
  };

  const handleAiModalClose = () => {
    setAiModalOpen(false);
  };

  const gridClassName = useMemo(() => {
    const baseClass = 'grid grid-cols-1 gap-6 sm:grid-cols-2';
    return platform === 'ios' ? `${baseClass} lg:grid-cols-5` : `${baseClass} lg:grid-cols-6`;
  }, [platform]);

  const previewData = useMemo(() => {
    const screensForPreview: ScreenPreviewItem[] = [];
    const indexMap = new Map<string, number>();

    screenState.items.forEach((item) => {
      const url = resolveScreenCoverUrl(item);
      if (!url) {
        return;
      }
      indexMap.set(item.screenId, screensForPreview.length);
      screensForPreview.push({
        ...item,
        previewUrl: url,
      });
    });

    return {
      screens: screensForPreview,
      indexMap,
    };
  }, [screenState.items]);

  const isInitialLoading = screenState.loading && screenState.currentPage <= 1 && screenState.items.length === 0;
  const isLoadingMore = screenState.loading && screenState.items.length > 0;
  const isEmpty = !screenState.loading && screenState.items.length === 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">

        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Segmented
            options={platformOptions}
            value={platform}
            onChange={handlePlatformChange}
            className="rounded-full border border-gray-200 bg-white shadow-sm"
          />
          <Button
            type="default"
            shape="circle"
            icon={<OpenAIOutlined />}
            onClick={handleAiModalOpen}
            title="AI 搜索"
          />
          <Badge count={activeFilterCount} showZero={false} offset={[-4, 4]}>
            <Button
              type="default"
              shape="circle"
              icon={<FilterOutlined />}
              onClick={() => setFilterModalOpen(true)}
            />
          </Badge>
        </div>
      </header>

      <section className="space-y-6">
        {isInitialLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spin tip="加载页面列表" />
          </div>
        ) : isEmpty ? (
          <Empty description="暂无页面" className="py-16" />
        ) : (
          <>
            <div className={gridClassName}>
              {screenState.items.map((screen) => {
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
                    key={screen.screenId}
                    coverUrl={coverUrl}
                    fallbackText="暂无预览"
                    variant={variant}
                    className={cardClassName}
                    preview={previewConfig}
                    isRecommended={Boolean(screen.isRecommended || screen.isAiRecommended)}
                    isFavorite={screen.isFavorite ?? false}
                    favoritePending={Boolean(favoritePending[screen.screenId])}
                    onToggleFavorite={(next) => {
                      void handleScreenFavoriteToggle(screen.screenId, next);
                    }}
                  />
                );
              })}
            </div>

            {isLoadingMore ? (
              <div className="flex justify-center text-sm text-gray-500">
                <Spin size="small" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : null}

            {!screenState.hasMore && screenState.items.length > 0 ? (
              <p className="text-center text-sm text-gray-400">
                已展示全部 {screenState.total} 个页面
              </p>
            ) : null}
          </>
        )}

        <div ref={sentinelRef} className="h-1 w-full" />
      </section>

      <BackTop visibilityHeight={240} target={backTopTarget} />
      <AISearch
        open={aiModalOpen}
        platform={platform}
        onClose={handleAiModalClose}
        onToggleFavorite={handleScreenFavoriteToggle}
        favoritePending={favoritePending}
      />
      <FilterModal
        open={filterModalOpen}
        loading={filtersLoading}
        fields={filterFields}
        primaryOptions={primaryFilterOptions}
        childrenOptions={childrenFilterOptions}
        value={appliedFilters}
        onFetchChildren={handleFetchChildrenOptions}
        onApply={handleFilterApply}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default ScreenListPage;
