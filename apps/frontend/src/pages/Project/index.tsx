import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Segmented, Spin, Empty, BackTop } from 'antd';
import type { SegmentedValue } from 'antd/es/segmented';
import type { ProjectListParams, ProjectPlatform } from '../../services/project';
import { getProjects } from '../../services/project';
import ProjectCard from '../../components/ProjectCard';
import { useNavigate } from 'react-router-dom';
import { useProjectListContext } from '../../contexts/ProjectListContext';

const PAGE_SIZE = 30;

const platformOptions: { label: string; value: ProjectPlatform }[] = [
  { label: 'iOS', value: 'ios' },
  { label: 'Web', value: 'web' },
];

const secondaryFilters = ['最新', '最受欢迎', '高评分'];

const useInfinityProjects = () => {
  const { state, setState } = useProjectListContext();
  const { platform, projects, currentPage, hasMore, total, error, loading, scrollTop } = state;
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchProjects = useCallback(
    async (
      params: Pick<ProjectListParams, 'page'> & { replace?: boolean; platform?: ProjectPlatform },
    ) => {
      if (loadingRef.current && !params.replace) {
        return;
      }

      const targetPlatform = params.platform ?? platform;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      loadingRef.current = true;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await getProjects({
          page: params.page,
          pageSize: PAGE_SIZE,
          platform: targetPlatform,
        });
        const { items, total: totalItems } = response.data;
        const nextPage = typeof params.page === 'number' ? params.page ?? 1 : Number(params.page ?? 1);
        const totalCount = typeof totalItems === 'number' ? totalItems : Number(totalItems ?? 0);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setState((prev) => {
          const nextProjects = params.replace ? items : [...prev.projects, ...items];
          return {
            ...prev,
            projects: nextProjects,
            currentPage: nextPage,
            total: totalCount,
            hasMore: nextPage * PAGE_SIZE < totalCount && items.length > 0,
            loading: false,
            error: null,
          };
        });
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: (err as Error)?.message ?? '加载项目失败',
          }));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
        }
      }
    },
    [platform, setState],
  );

  useEffect(() => {
    if (projects.length > 0 || loadingRef.current) {
      return;
    }

    void fetchProjects({ page: 1, replace: true, platform });
  }, [fetchProjects, platform, projects.length]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) {
      return;
    }

    void fetchProjects({ page: currentPage + 1, platform });
  }, [currentPage, fetchProjects, hasMore, platform]);

  const setPlatform = useCallback(
    (nextPlatform: ProjectPlatform) => {
      setState((prev) => {
        if (prev.platform === nextPlatform) {
          return prev;
        }

        return {
          ...prev,
          platform: nextPlatform,
          projects: [],
          currentPage: 0,
          total: 0,
          hasMore: true,
          loading: false,
          error: null,
          scrollTop: 0,
        };
      });

      loadingRef.current = false;
      requestIdRef.current += 1;
    },
    [setState],
  );

  const setScrollTop = useCallback(
    (value: number) => {
      setState((prev) => {
        if (prev.scrollTop === value) {
          return prev;
        }

        return {
          ...prev,
          scrollTop: value,
        };
      });
    },
    [setState],
  );

  return {
    platform,
    projects,
    loading,
    hasMore,
    total,
    error,
    loadMore,
    setPlatform,
    scrollTop,
    setScrollTop,
  };
};

const ProjectPage: React.FC = () => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const restoredScrollRef = useRef(false);
  const navigate = useNavigate();
  const backTopTarget = useCallback(() => window, []);
  const { platform, projects, loading, hasMore, total, error, loadMore, setPlatform, scrollTop, setScrollTop } =
    useInfinityProjects();
  const gridClassName = useMemo(() => {
    if (platform === 'ios') {
      return 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';
    }

    return 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2';
  }, [platform]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
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
  }, [loadMore]);

  useLayoutEffect(() => {
    if (restoredScrollRef.current) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (scrollTop > 0) {
      window.scrollTo({ top: scrollTop, behavior: 'auto' });
      restoredScrollRef.current = true;
    }
  }, [scrollTop]);

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') {
        return;
      }

      setScrollTop(window.scrollY ?? 0);
    };
  }, [setScrollTop]);

  const handlePlatformChange = (value: SegmentedValue) => {
    const nextPlatform = value as ProjectPlatform;
    if (nextPlatform === platform) {
      return;
    }

    setPlatform(nextPlatform);
    setScrollTop(0);
    restoredScrollRef.current = true;

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleProjectClick = useCallback(
    (projectId: string) => {
      if (typeof window !== 'undefined') {
        restoredScrollRef.current = true;
        setScrollTop(window.scrollY ?? 0);
      }

      navigate(`/project/${projectId}`);
    },
    [navigate, setScrollTop],
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">项目库</h1>
          <p className="text-sm text-gray-500">
            浏览最新的设计项目，切换平台查看对应的屏幕预览。
          </p>
        </div>

        <Segmented
          size="large"
          options={platformOptions}
          value={platform}
          onChange={handlePlatformChange}
          className="self-start rounded-full border border-gray-200 bg-white shadow-sm"
        />
      </header>

      <nav className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        {secondaryFilters.map((label) => (
          <span
            key={label}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600"
          >
            {label}
          </span>
        ))}
      </nav>

      <section className={gridClassName}>
        {projects.map((project) => (
          <ProjectCard
            key={project.projectId}
            project={project}
            onClick={handleProjectClick}
          />
        ))}
      </section>

      {projects.length === 0 && !loading ? (
        <Empty description="暂无项目" className="py-16" />
      ) : null}

      <div className="flex justify-center">
        {loading ? <Spin tip="加载中" /> : null}
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!hasMore && projects.length > 0 ? (
        <p className="text-center text-sm text-gray-400">
          已展示全部 {total} 个项目
        </p>
      ) : null}

      <div ref={sentinelRef} className="h-1" />

      <BackTop visibilityHeight={240} target={backTopTarget} />
    </div>
  );
};

export default ProjectPage;
