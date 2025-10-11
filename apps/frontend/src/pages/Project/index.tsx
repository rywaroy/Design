import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Segmented, Spin, Empty } from 'antd';
import type { SegmentedValue } from 'antd/es/segmented';
import type {
  ProjectListItem,
  ProjectListParams,
  ProjectPlatform,
} from '../../services/project';
import { getProjects } from '../../services/project';
import ProjectCard from '../../components/ProjectCard';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 30;
const DEFAULT_PLATFORM: ProjectPlatform = 'ios';

const platformOptions: { label: string; value: ProjectPlatform }[] = [
  { label: 'iOS', value: 'ios' },
  { label: 'Web', value: 'web' },
];

const secondaryFilters = ['最新', '最受欢迎', '高评分'];

const useInfinityProjects = (platform: ProjectPlatform) => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchProjects = useCallback(
    async (params: Pick<ProjectListParams, 'page'> & { replace?: boolean }) => {
      if (loadingRef.current && !params.replace) {
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const response = await getProjects({
          page: params.page,
          pageSize: PAGE_SIZE,
          platform,
        });
        const { items, total: totalItems } = response.data;
        const nextPage = typeof params.page === 'number' ? params.page ?? 1 : Number(params.page ?? 1);
        const totalCount = typeof totalItems === 'number' ? totalItems : Number(totalItems ?? 0);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setProjects((prev) => (params.replace ? items : [...prev, ...items]));
        setCurrentPage(nextPage);
        setTotal(totalCount);
        setHasMore(nextPage * PAGE_SIZE < totalCount && items.length > 0);
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError((err as Error)?.message ?? '加载项目失败');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [platform],
  );

  useEffect(() => {
    setProjects([]);
    setCurrentPage(0);
    setHasMore(true);
    setTotal(0);
    setError(null);

    loadingRef.current = false;

    void fetchProjects({ page: 1, replace: true });
  }, [platform, fetchProjects]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) {
      return;
    }

    void fetchProjects({ page: currentPage + 1 });
  }, [currentPage, fetchProjects, hasMore]);

  return {
    projects,
    loading,
    hasMore,
    total,
    error,
    loadMore,
  };
};

const ProjectPage: React.FC = () => {
  const [platform, setPlatform] = useState<ProjectPlatform>(DEFAULT_PLATFORM);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { projects, loading, hasMore, total, error, loadMore } = useInfinityProjects(platform);
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [platform]);

  const handlePlatformChange = (value: SegmentedValue) => {
    setPlatform(value as ProjectPlatform);
  };

  const handleProjectClick = useCallback(
    (projectId: string) => {
      navigate(`/project/${projectId}`);
    },
    [navigate],
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
    </div>
  );
};

export default ProjectPage;
