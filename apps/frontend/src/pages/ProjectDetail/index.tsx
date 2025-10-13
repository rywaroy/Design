import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackTop, Button, Empty, Spin, Tag } from 'antd';
import { DownloadOutlined, HeartFilled, HeartOutlined, LeftOutlined } from '@ant-design/icons';
import type { Project } from '@design/shared-types';
import { getProjectDetail } from '../../services/project';
import { getProjectScreens, type ScreenListItem } from '../../services/screen';
import { appendImageResizeParam, resolveAssetUrl } from '../../lib/asset';
import ScreenCard, { type ScreenCardAction } from '../../components/ScreenCard';
import type { ScreenPreviewItem } from '../../components/ImagePreviewModal';
import {
  favoriteProject,
  favoriteScreen,
  unfavoriteProject,
  unfavoriteScreen,
} from '../../services/favorite';
import { useProjectListContext } from '../../contexts/ProjectListContext';

const SCREEN_PAGE_SIZE = 30;

const platformLabelMap: Record<string, string> = {
  ios: 'iOS',
  web: 'Web',
};

const getPlatformLabel = (platform?: string) => {
  if (!platform) {
    return '未知平台';
  }

  return platformLabelMap[platform] ?? platform;
};

interface ScreenState {
  items: ScreenListItem[];
  page: number;
  pageSize: number;
  loading: boolean;
  hasMore: boolean;
}

const createInitialScreenState = (): ScreenState => ({
  items: [],
  page: 0,
  pageSize: SCREEN_PAGE_SIZE,
  loading: false,
  hasMore: true,
});

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

const openInNewTab = (url: string) => {
  if (!url) {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

const extractFilename = (url: string) => {
  try {
    const parsed = new URL(url, window.location.href);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return 'download';
    }
    return segments[segments.length - 1];
  } catch (_error) {
    return 'download';
  }
};

const downloadFile = async (url: string) => {
  if (!url || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = extractFilename(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.warn('下载原图失败，改为新窗口打开:', error);
    openInNewTab(url);
  }
};

const buildScreenActions = (screen: ScreenListItem): ScreenCardAction[] => {
  const actions: ScreenCardAction[] = [];
  const previewUrl = resolveScreenCoverUrl(screen);

  if (screen.originalUrl) {
    const originalUrl = resolveAssetUrl(screen.originalUrl) ?? screen.originalUrl;
    if (originalUrl && originalUrl !== previewUrl) {
      actions.push({
        key: `${screen.screenId}-source`,
        label: '下载原图',
        icon: <DownloadOutlined />,
        onClick: () => {
          void downloadFile(originalUrl);
        },
      });
    }
  }

  return actions;
};

const ProjectDetailPage: FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectFavoritePending, setProjectFavoritePending] = useState(false);
  const [projectFavoriteAnimating, setProjectFavoriteAnimating] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>(createInitialScreenState);
  const [screenFavoritePending, setScreenFavoritePending] = useState<Record<string, boolean>>({});
  const screenRequestIdRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const backTopTarget = useCallback(() => window, []);
  const projectFavoriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setState: setProjectListState } = useProjectListContext();
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
  const isInitialScreensLoading = screenState.loading && screenState.items.length === 0;
  const isScreenListEmpty = !isInitialScreensLoading && screenState.items.length === 0;
  const isLoadingMoreScreens = screenState.loading && screenState.items.length > 0;
  const projectLogoUrl = useMemo(() => {
    if (!project?.appLogoUrl) {
      return null;
    }
    const resolved = resolveAssetUrl(project.appLogoUrl) ?? project.appLogoUrl ?? null;
    if (!resolved) {
      return null;
    }
    return appendImageResizeParam(resolved, 200);
  }, [project?.appLogoUrl]);
  const mergeScreens = useCallback(
    (prevList: ScreenListItem[], nextItems: ScreenListItem[], replace?: boolean) => {
      if (replace) {
        return nextItems;
      }

      const indexMap = new Map<string, number>();
      const merged = [...prevList];

      prevList.forEach((item, index) => {
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
    },
    [],
  );
  const updateScreenFavorite = useCallback((screenId: string, nextFavorite: boolean) => {
    setScreenState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.screenId === screenId ? { ...item, isFavorite: nextFavorite } : item,
      ),
    }));
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!projectId) {
      setProjectLoading(false);
      return;
    }

    let active = true;
    setProjectLoading(true);
    setProject(null);

    getProjectDetail(projectId)
      .then((response) => {
        if (!active) {
          return;
        }
        setProject(response.data.project);
      })
      .finally(() => {
        if (active) {
          setProjectLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  const fetchScreens = useCallback(
    async (page: number, replace = false) => {
      if (!projectId) {
        setScreenState((prev) => ({
          ...prev,
          loading: false,
        }));
        return;
      }

      const requestId = screenRequestIdRef.current + 1;
      screenRequestIdRef.current = requestId;

      setScreenState((prev) => ({
        ...prev,
        loading: true,
      }));

      const response = await getProjectScreens({ projectId, page, pageSize: SCREEN_PAGE_SIZE });
      if (screenRequestIdRef.current !== requestId) {
        return;
      }

      const { items, total, page: currentPage, pageSize } = response.data;
      const parsedPage = typeof currentPage === 'number' ? currentPage : page;
      const parsedPageSize =
        typeof pageSize === 'number' && pageSize > 0 ? pageSize : SCREEN_PAGE_SIZE;
      const totalCount = typeof total === 'number' ? total : 0;
      const nextItems = items ?? [];

      setScreenState((prev) => ({
        items: mergeScreens(prev.items, nextItems, replace),
        page: parsedPage,
        pageSize: parsedPageSize,
        loading: false,
        hasMore: parsedPage * parsedPageSize < totalCount && nextItems.length > 0,
      }));
    },
    [mergeScreens, projectId],
  );

  useEffect(() => {
    setScreenState(createInitialScreenState());
    setScreenFavoritePending({});
    fetchScreens(1, true);
  }, [projectId, fetchScreens]);

  const syncProjectFavoriteToList = useCallback(
    (targetProjectId: string, nextFavorite: boolean) => {
      setProjectListState((prev) => ({
        ...prev,
        projects: prev.projects.map((item) =>
          item.projectId === targetProjectId
            ? {
                ...item,
                isFavorite: nextFavorite,
              }
            : item,
        ),
      }));
    },
    [setProjectListState],
  );

  const triggerProjectFavoriteAnimation = useCallback(() => {
    if (projectFavoriteTimerRef.current) {
      clearTimeout(projectFavoriteTimerRef.current);
    }
    setProjectFavoriteAnimating(true);
    projectFavoriteTimerRef.current = setTimeout(() => {
      setProjectFavoriteAnimating(false);
      projectFavoriteTimerRef.current = null;
    }, 260);
  }, []);

  const handleProjectFavoriteToggle = useCallback(
    async (nextFavorite: boolean) => {
      if (!project) {
        return;
      }
      const targetProjectId = project.projectId;
      triggerProjectFavoriteAnimation();
      setProjectFavoritePending(true);
      try {
        if (nextFavorite) {
          await favoriteProject(targetProjectId);
        } else {
          await unfavoriteProject(targetProjectId);
        }
        setProject((prev) =>
          prev
            ? {
                ...prev,
                isFavorite: nextFavorite,
              }
            : prev,
        );
        syncProjectFavoriteToList(targetProjectId, nextFavorite);
      } catch (error) {
        console.error('更新项目收藏状态失败', error);
      } finally {
        setProjectFavoritePending(false);
      }
    },
    [project, syncProjectFavoriteToList, triggerProjectFavoriteAnimation],
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
        } else {
          await unfavoriteScreen(screenId);
        }
        updateScreenFavorite(screenId, nextFavorite);
      } catch (error) {
        console.error('更新页面收藏状态失败', error);
      } finally {
        setScreenFavoritePending((prev) => {
          const nextState = { ...prev };
          delete nextState[screenId];
          return nextState;
        });
      }
    },
    [updateScreenFavorite],
  );

  useEffect(() => {
    return () => {
      if (projectFavoriteTimerRef.current) {
        clearTimeout(projectFavoriteTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (project) {
      syncProjectFavoriteToList(project.projectId, project.isFavorite ?? false);
    }
  }, [project, syncProjectFavoriteToList]);

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

        if (screenState.loading || !screenState.hasMore) {
          return;
        }

        fetchScreens(screenState.page + 1);
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchScreens, screenState.loading, screenState.hasMore, screenState.page]);

  const projectKeywords = useMemo(() => {
    if (!project?.keywords) {
      return [] as string[];
    }
    return project.keywords.filter((item) => item.trim().length > 0).slice(0, 10);
  }, [project?.keywords]);

  return (
    <div className="space-y-8">
      <Button type="text" icon={<LeftOutlined />} onClick={handleBack} className="px-0 text-gray-600">
        返回
      </Button>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:p-8">
        {projectLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spin tip="加载项目详情" />
          </div>
        ) : project ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {projectLogoUrl ? (
                  <img
                    src={projectLogoUrl}
                    alt={`${project.appName} logo`}
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-16 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-lg font-semibold text-gray-500">
                    {project.appName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-start gap-3">
                    <h1 className="text-2xl font-semibold text-gray-900">{project.appName}</h1>
                    <button
                      type="button"
                      aria-label={project.isFavorite ? '取消收藏项目' : '收藏项目'}
                      aria-pressed={project.isFavorite}
                      disabled={projectFavoritePending}
                      className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg shadow-sm transition-all duration-200 ${
                        project.isFavorite ? '!text-[#ED3F27]' : 'text-gray-500'
                      } ${
                        projectFavoritePending ? 'cursor-wait opacity-70' : 'hover:scale-110 active:scale-95'
                      } ${projectFavoriteAnimating ? 'animate-favorite-bounce' : ''}`}
                      onClick={() => {
                        void handleProjectFavoriteToggle(!(project.isFavorite ?? false));
                      }}
                    >
                      {project.isFavorite ? <HeartFilled /> : <HeartOutlined />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{getPlatformLabel(project.platform)}</p>
                </div>
              </div>
            </div>

            {project.appTagline ? (
              <p className="text-base text-gray-600">{project.appTagline}</p>
            ) : null}

            {projectKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {projectKeywords.map((keyword) => (
                  <Tag key={keyword} bordered={false} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                    {keyword}
                  </Tag>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <Empty description="未找到项目详情" />
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:p-8">
        <h2 className="text-xl font-semibold text-gray-900">页面列表</h2>

        {isInitialScreensLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spin tip="加载页面列表" />
          </div>
        ) : isScreenListEmpty ? (
          <Empty description="暂无页面" className="py-16" />
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
              {screenState.items.map((screen) => {
                const coverUrl = resolveScreenCoverUrl(screen);
                const actions = buildScreenActions(screen);
                const isWeb = screen.platform === 'web';
                const variant: 'ios' | 'web' = isWeb ? 'web' : 'ios';
                const cardClassName = isWeb
                  ? 'lg:col-span-3'
                  : 'lg:col-span-2';
                const previewEntryIndex = previewData.indexMap.get(screen.screenId);
                const previewConfig =
                  typeof previewEntryIndex === 'number'
                    ? {
                        screens: previewData.screens,
                        initialIndex: previewEntryIndex,
                      }
                    : undefined;

                return (
                  <ScreenCard
                    key={screen.screenId}
                    coverUrl={coverUrl}
                    actions={actions}
                    fallbackText="暂无预览"
                    variant={variant}
                    className={cardClassName}
                    preview={previewConfig}
                    isRecommended={Boolean(screen.isRecommended)}
                    isFavorite={screen.isFavorite ?? false}
                    favoritePending={Boolean(screenFavoritePending[screen.screenId])}
                    onToggleFavorite={(next) => {
                      void handleScreenFavoriteToggle(screen.screenId, next);
                    }}
                  />
                );
              })}
            </div>
            {isLoadingMoreScreens ? (
              <div className="mt-4 flex justify-center text-sm text-gray-500">
                <Spin size="small" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : null}
            {!screenState.hasMore && !isInitialScreensLoading && !isLoadingMoreScreens ? (
              <p className="mt-6 text-center text-sm text-gray-400">已经到底啦</p>
            ) : null}
          </>
        )}
        <div ref={sentinelRef} className="h-1 w-full" />
      </section>

      <BackTop visibilityHeight={240} target={backTopTarget} />
    </div>
  );
};

export default ProjectDetailPage;
