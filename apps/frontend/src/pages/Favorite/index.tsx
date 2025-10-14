import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as AntApp, Empty, Segmented, Spin, Tabs } from 'antd';
import type { SegmentedValue } from 'antd/es/segmented';
import { useNavigate } from 'react-router-dom';
import type { ProjectListItem } from '../../services/project';
import type { ScreenListItem } from '../../services/screen';
import ProjectCard from '../../components/ProjectCard';
import ScreenCard from '../../components/ScreenCard';
import type { ScreenPreviewItem } from '../../components/ImagePreviewModal';
import {
  favoriteProject,
  favoriteScreen,
  getFavoriteProjects,
  getFavoriteScreens,
  unfavoriteProject,
  unfavoriteScreen,
} from '../../services/favorite';
import { resolveAssetUrl } from '../../lib/asset';
import {
  useFavoriteContext,
  type FavoritePlatform,
  type FavoriteTab,
  type FavoriteListState,
} from '../../contexts/FavoriteContext';
import { useProjectListContext } from '../../contexts/ProjectListContext';

const PAGE_SIZE = 30;

const PLATFORM_OPTIONS: { label: string; value: FavoritePlatform }[] = [
  { label: 'iOS', value: 'ios' },
  { label: 'Web', value: 'web' },
];

const mergeProjectItems = (
  prevItems: ProjectListItem[],
  nextItems: ProjectListItem[],
  replace?: boolean,
) => {
  if (replace) {
    return nextItems;
  }

  const indexMap = new Map<string, number>();
  const merged = [...prevItems];

  prevItems.forEach((item, index) => {
    indexMap.set(item.projectId, index);
  });

  nextItems.forEach((item) => {
    const existingIndex = indexMap.get(item.projectId);
    if (typeof existingIndex === 'number') {
      merged[existingIndex] = item;
    } else {
      indexMap.set(item.projectId, merged.length);
      merged.push(item);
    }
  });

  return merged;
};

const mergeScreenItems = (
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

const createEmptyListState = <T,>(): FavoriteListState<T> => ({
  items: [],
  page: 0,
  total: 0,
  hasMore: true,
  loading: false,
  scrollTop: 0,
});

const FavoritePage: React.FC = () => {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const { state, setState } = useFavoriteContext();
  const { setState: setProjectListState } = useProjectListContext();
  const { activeTab, platform, project, screen } = state;
  const projectSentinelRef = useRef<HTMLDivElement | null>(null);
  const screenSentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef<{ project: number; screen: number }>({ project: 0, screen: 0 });
  const scrollRestoredRef = useRef<{ project: boolean; screen: boolean }>({
    project: false,
    screen: false,
  });
  const [projectFavoritePending, setProjectFavoritePending] = useState<Record<string, boolean>>({});
  const [screenFavoritePending, setScreenFavoritePending] = useState<Record<string, boolean>>({});

  const screenPreviewData = useMemo(() => {
    const previewScreens: ScreenPreviewItem[] = [];
    const indexMap = new Map<string, number>();

    screen.items.forEach((item) => {
      const url = resolveScreenCoverUrl(item);
      if (!url) {
        return;
      }
      indexMap.set(item.screenId, previewScreens.length);
      previewScreens.push({
        ...item,
        previewUrl: url,
      });
    });

    return {
      screens: previewScreens,
      indexMap,
    };
  }, [screen.items]);

  const currentState = activeTab === 'project' ? project : screen;
  const currentHasMore = currentState.hasMore;
  const currentLoading = currentState.loading;
  const currentPage = currentState.page;

  const fetchFavorites = useCallback(
    async (tab: FavoriteTab, page: number, replace: boolean, platformFilter: FavoritePlatform) => {
      const requestId = requestIdRef.current[tab] + 1;
      requestIdRef.current[tab] = requestId;

      setState((prev) => {
        if (tab === 'project') {
          return {
            ...prev,
            project: {
              ...prev.project,
              loading: true,
            },
          };
        }

        return {
          ...prev,
          screen: {
            ...prev.screen,
            loading: true,
          },
        };
      });

      try {
        const response =
          tab === 'project'
            ? await getFavoriteProjects({ page, pageSize: PAGE_SIZE, platform: platformFilter })
            : await getFavoriteScreens({ page, pageSize: PAGE_SIZE, platform: platformFilter });

        if (requestId !== requestIdRef.current[tab]) {
          return;
        }

        const { items, total, page: returnedPage } = response.data;
        const resolvedPage = Math.max(returnedPage ?? page, page);

        setState((prev) => {
          if (tab === 'project') {
            const prevList = prev.project;
            const nextItems = mergeProjectItems(prevList.items, items as ProjectListItem[], replace);
            const totalCount = typeof total === 'number' ? total : nextItems.length;
            const hasMore = resolvedPage * PAGE_SIZE < totalCount && items.length > 0;

            return {
              ...prev,
              project: {
                ...prevList,
                items: nextItems,
                page: resolvedPage,
                total: totalCount,
                hasMore,
                loading: false,
              },
            };
          }

          const prevList = prev.screen;
          const nextItems = mergeScreenItems(prevList.items, items as ScreenListItem[], replace);
          const totalCount = typeof total === 'number' ? total : nextItems.length;
          const hasMore = resolvedPage * PAGE_SIZE < totalCount && items.length > 0;

          return {
            ...prev,
            screen: {
              ...prevList,
              items: nextItems,
              page: resolvedPage,
              total: totalCount,
              hasMore,
              loading: false,
            },
          };
        });
      } catch (error) {
        if (requestId !== requestIdRef.current[tab]) {
          return;
        }

        setState((prev) => {
          if (tab === 'project') {
            return {
              ...prev,
              project: {
                ...prev.project,
                loading: false,
              },
            };
          }

          return {
            ...prev,
            screen: {
              ...prev.screen,
              loading: false,
            },
          };
        });
      }
    },
    [setState],
  );

  useEffect(() => {
    const targetState = activeTab === 'project' ? project : screen;
    if (targetState.page === 0 && !targetState.loading) {
      void fetchFavorites(activeTab, 1, true, platform);
    }
  }, [
    activeTab,
    fetchFavorites,
    platform,
    project.loading,
    project.page,
    screen.loading,
    screen.page,
  ]);

  const loadMore = useCallback(() => {
    if (!currentHasMore || currentLoading) {
      return;
    }
    void fetchFavorites(activeTab, currentPage + 1, false, platform);
  }, [activeTab, currentHasMore, currentLoading, currentPage, fetchFavorites, platform]);

  useEffect(() => {
    const sentinel =
      activeTab === 'project' ? projectSentinelRef.current : screenSentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [activeTab, loadMore]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!scrollRestoredRef.current[activeTab]) {
      const targetState = activeTab === 'project' ? project : screen;
      window.scrollTo({ top: targetState.scrollTop ?? 0, behavior: 'auto' });
      scrollRestoredRef.current[activeTab] = true;
    }
  }, [activeTab, project.scrollTop, screen.scrollTop]);

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') {
        return;
      }
      const scrollTop = window.scrollY ?? 0;
      setState((prev) => {
        if (activeTab === 'project') {
          return {
            ...prev,
            project: {
              ...prev.project,
              scrollTop,
            },
          };
        }

        return {
          ...prev,
          screen: {
            ...prev.screen,
            scrollTop,
          },
        };
      });
    };
  }, [activeTab, setState]);

  const handleTabChange = useCallback(
    (key: string) => {
      const tab = key as FavoriteTab;
      if (tab === activeTab) {
        return;
      }

      scrollRestoredRef.current[tab] = false;
      setState((prev) => ({
        ...prev,
        activeTab: tab,
      }));
    },
    [activeTab, setState],
  );

  const handlePlatformChange = (value: SegmentedValue) => {
    const nextPlatform = value as FavoritePlatform;
    if (nextPlatform === platform) {
      return;
    }

    requestIdRef.current = { project: 0, screen: 0 };
    scrollRestoredRef.current = { project: false, screen: false };
    setProjectFavoritePending({});
    setScreenFavoritePending({});

    setState((prev) => ({
      ...prev,
      platform: nextPlatform,
      project: createEmptyListState<ProjectListItem>(),
      screen: createEmptyListState<ScreenListItem>(),
    }));

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const syncProjectFavoriteToList = useCallback(
    (projectId: string, nextFavorite: boolean) => {
      setProjectListState((prev) => ({
        ...prev,
        projects: prev.projects.map((item) =>
          item.projectId === projectId ? { ...item, isFavorite: nextFavorite } : item,
        ),
      }));
    },
    [setProjectListState],
  );

  const handleProjectClick = useCallback(
    (projectId: string) => {
      navigate(`/project/${projectId}`);
    },
    [navigate],
  );

  const handleProjectFavoriteToggle = useCallback(
    async (projectId: string, nextFavorite: boolean) => {
      setProjectFavoritePending((prev) => ({
        ...prev,
        [projectId]: true,
      }));

      try {
        if (nextFavorite) {
          await favoriteProject(projectId);
          setState((prev) => ({
            ...prev,
            project: {
              ...prev.project,
              items: prev.project.items.map((item) =>
                item.projectId === projectId ? { ...item, isFavorite: true } : item,
              ),
            },
          }));
          message.success('已收藏项目');
          syncProjectFavoriteToList(projectId, true);
        } else {
          await unfavoriteProject(projectId);
          message.success('已取消收藏项目');
          syncProjectFavoriteToList(projectId, false);
          setState((prev) => {
            const prevList = prev.project;
            const nextItems = prevList.items.filter((item) => item.projectId !== projectId);
            const nextTotal = Math.max(0, prevList.total - 1);

            return {
              ...prev,
              project: {
                ...prevList,
                items: nextItems,
                total: nextTotal,
              },
            };
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setProjectFavoritePending((prev) => {
          const nextState = { ...prev };
          delete nextState[projectId];
          return nextState;
        });
      }
    },
    [message, setState, syncProjectFavoriteToList],
  );

  const handleScreenFavoriteToggle = useCallback(
    async (screenId: string, nextFavorite: boolean) => {
      setScreenFavoritePending((prev) => ({
        ...prev,
        [screenId]: true,
      }));

      try {
        if (nextFavorite) {
          await favoriteScreen(screenId);
          setState((prev) => ({
            ...prev,
            screen: {
              ...prev.screen,
              items: prev.screen.items.map((item) =>
                item.screenId === screenId ? { ...item, isFavorite: true } : item,
              ),
            },
          }));
          message.success('已收藏页面');
        } else {
          await unfavoriteScreen(screenId);
          message.success('已取消收藏页面');
          setState((prev) => {
            const prevList = prev.screen;
            const nextItems = prevList.items.filter((item) => item.screenId !== screenId);
            const nextTotal = Math.max(0, prevList.total - 1);

            return {
              ...prev,
              screen: {
                ...prevList,
                items: nextItems,
                total: nextTotal,
              },
            };
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setScreenFavoritePending((prev) => {
          const nextState = { ...prev };
          delete nextState[screenId];
          return nextState;
        });
      }
    },
    [message, setState],
  );

  const projectGridClassName = useMemo(() => {
    return platform === 'ios'
      ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2';
  }, [platform]);

  const renderProjectSection = () => {
    if (project.items.length === 0 && project.loading) {
      return (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spin tip="加载项目收藏" />
        </div>
      );
    }

    if (project.items.length === 0 && !project.loading) {
      return <Empty description="暂无项目收藏" className="py-16" />;
    }

    return (
      <>
        <section className={projectGridClassName}>
          {project.items.map((item) => (
            <ProjectCard
              key={item.projectId}
              project={item}
              onClick={handleProjectClick}
              isFavorite={item.isFavorite ?? true}
              favoritePending={Boolean(projectFavoritePending[item.projectId])}
              onToggleFavorite={(next) => {
                void handleProjectFavoriteToggle(item.projectId, next);
              }}
            />
          ))}
        </section>
        <div className="mt-6 flex justify-center">
          {project.loading ? <Spin tip="加载中" /> : null}
        </div>
      </>
    );
  };

  const renderScreenSection = () => {
    if (screen.items.length === 0 && screen.loading) {
      return (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spin tip="加载页面收藏" />
        </div>
      );
    }

    if (screen.items.length === 0 && !screen.loading) {
      return <Empty description="暂无页面收藏" className="py-16" />;
    }

    return (
      <>
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {screen.items.map((item) => {
            const coverUrl = resolveScreenCoverUrl(item);
            const isWeb = item.platform === 'web';
            const variant: 'ios' | 'web' = isWeb ? 'web' : 'ios';
            const cardClassName = isWeb ? 'lg:col-span-3' : 'lg:col-span-2';
            const previewEntryIndex = screenPreviewData.indexMap.get(item.screenId);
            const previewScreens = screenPreviewData.screens;
            const previewConfig =
              previewScreens.length > 0
                ? {
                    screens: previewScreens,
                    initialIndex:
                      typeof previewEntryIndex === 'number' ? previewEntryIndex : undefined,
                  }
                : undefined;

            return (
              <ScreenCard
                key={item.screenId}
                coverUrl={coverUrl}
                fallbackText="暂无预览"
                variant={variant}
                className={cardClassName}
                preview={previewConfig}
                isFavorite={item.isFavorite ?? true}
                favoritePending={Boolean(screenFavoritePending[item.screenId])}
                onToggleFavorite={(next) => {
                  void handleScreenFavoriteToggle(item.screenId, next);
                }}
              />
            );
          })}
        </section>
        <div className="mt-6 flex justify-center">
          {screen.loading ? <Spin tip="加载中" /> : null}
        </div>
      </>
    );
  };

  const projectPane = (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:p-8">
      {renderProjectSection()}
      <div
        ref={activeTab === 'project' ? projectSentinelRef : undefined}
        className="h-1 w-full"
      />
      {!project.hasMore && project.items.length > 0 ? (
        <p className="mt-6 text-center text-sm text-gray-400">已经到底啦</p>
      ) : null}
    </section>
  );

  const screenPane = (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:p-8">
      {renderScreenSection()}
      <div
        ref={activeTab === 'screen' ? screenSentinelRef : undefined}
        className="h-1 w-full"
      />
      {!screen.hasMore && screen.items.length > 0 ? (
        <p className="mt-6 text-center text-sm text-gray-400">已经到底啦</p>
      ) : null}
    </section>
  );

  const tabItems = [
    { key: 'project', label: '项目收藏', children: projectPane },
    { key: 'screen', label: '页面收藏', children: screenPane },
  ];

  const totalCount = activeTab === 'project' ? project.total : screen.total;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">我的收藏</h1>
          <p className="text-sm text-gray-500">快速访问你收藏的项目与页面，随时继续查看。</p>
        </div>

        <div className="flex flex-col items-end gap-3 md:flex-row md:items-center">
          <Segmented
            size="large"
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={handlePlatformChange}
            className="self-start rounded-full border border-gray-200 bg-white shadow-sm"
          />
          <span className="text-sm text-gray-500">当前共 {totalCount} 个收藏</span>
        </div>
      </header>

      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={handleTabChange}
        destroyInactiveTabPane
      />
    </div>
  );
};

export default FavoritePage;
