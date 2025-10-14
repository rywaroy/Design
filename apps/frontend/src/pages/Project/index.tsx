import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Segmented, Spin, Empty, FloatButton, Badge, Button } from 'antd';
import type { SegmentedValue } from 'antd/es/segmented';
import { FilterOutlined } from '@ant-design/icons';
import type { ProjectListItem, ProjectListParams, ProjectPlatform } from '../../services/project';
import { getProjects, getProjectFilters } from '../../services/project';
import ProjectCard from '../../components/ProjectCard';
import { useNavigate } from 'react-router-dom';
import { useProjectListContext } from '../../contexts/ProjectListContext';
import {
  favoriteProject,
  unfavoriteProject,
} from '../../services/favorite';
import FilterModal, { type FilterFieldConfig, type FilterSelectionState } from '../../components/FilterModal';
import {
  PROJECT_FILTER_FIELDS,
  findProjectFilterFieldConfig,
  type ProjectFilterDatasetKey,
  type ProjectFilterSelectionState,
} from '../../constants/projectFilters';

const PAGE_SIZE = 30;

const BackTop = FloatButton.BackTop;

const platformOptions: { label: string; value: ProjectPlatform }[] = [
  { label: 'iOS', value: 'ios' },
  { label: 'Web', value: 'web' },
];

const secondaryFilters = ['最新', '最受欢迎', '高评分'];

const createInitialPrimaryOptions = () =>
  PROJECT_FILTER_FIELDS.reduce<Record<ProjectFilterDatasetKey, string[]>>((acc, field) => {
    acc[field.datasetKey] = [];
    return acc;
  }, {} as Record<ProjectFilterDatasetKey, string[]>);

const createInitialChildrenOptions = () =>
  PROJECT_FILTER_FIELDS.reduce<Record<ProjectFilterDatasetKey, Record<string, string[]>>>(
    (acc, field) => {
      acc[field.datasetKey] = {};
      return acc;
    },
    {} as Record<ProjectFilterDatasetKey, Record<string, string[]>>,
  );

const useInfinityProjects = (
  convertFiltersToParams: (selection: ProjectFilterSelectionState) => Partial<ProjectListParams>,
) => {
  const { state, setState } = useProjectListContext();
  const { platform, projects, currentPage, hasMore, total, loading, scrollTop, filters } = state;
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const filtersRef = useRef<ProjectFilterSelectionState>(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  const mergeProjects = useCallback(
    (prevList: ProjectListItem[], nextItems: ProjectListItem[], replace?: boolean) => {
      if (replace) {
        return nextItems;
      }

      const indexMap = new Map<string, number>();
      const merged = [...prevList];

      prevList.forEach((item, index) => {
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
    },
    [],
  );

  const fetchProjects = useCallback(
    async (
      params: Pick<ProjectListParams, 'page'> & {
        replace?: boolean;
        platform?: ProjectPlatform;
        filtersSelection?: ProjectFilterSelectionState;
      },
    ) => {
      if (loadingRef.current && !params.replace) {
        return;
      }

      const targetPlatform = params.platform ?? platform;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      loadingRef.current = true;

      const selection = params.filtersSelection ?? filtersRef.current;
      const filterParams = convertFiltersToParams(selection);

      setState((prev) => ({
        ...prev,
        loading: true,
      }));

      const response = await getProjects({
        page: params.page,
        pageSize: PAGE_SIZE,
        platform: targetPlatform,
        ...filterParams,
      });
      const { items, total: totalItems } = response.data;
      const nextPage = typeof params.page === 'number' ? params.page ?? 1 : Number(params.page ?? 1);
      const totalCount = typeof totalItems === 'number' ? totalItems : Number(totalItems ?? 0);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setState((prev) => {
        const nextProjects = mergeProjects(prev.projects, items, params.replace);
        return {
          ...prev,
          projects: nextProjects,
          currentPage: nextPage,
          total: totalCount,
          hasMore: nextPage * PAGE_SIZE < totalCount && items.length > 0,
          loading: false,
        };
      });
      loadingRef.current = false;
    },
    [convertFiltersToParams, mergeProjects, platform, setState],
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
          scrollTop: 0,
        };
      });

      loadingRef.current = false;
      requestIdRef.current += 1;
    },
    [setState],
  );

  const setFilters = useCallback(
    (nextFilters: ProjectFilterSelectionState) => {
      setState((prev) => ({
        ...prev,
        filters: nextFilters,
      }));
    },
    [setState],
  );

  const refresh = useCallback(
    (selection?: ProjectFilterSelectionState) => {
      void fetchProjects({ page: 1, replace: true, filtersSelection: selection });
    },
    [fetchProjects],
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

  const updateProjectFavorite = useCallback(
    (projectId: string, nextFavorite: boolean) => {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((item) =>
          item.projectId === projectId ? { ...item, isFavorite: nextFavorite } : item,
        ),
      }));
    },
    [setState],
  );

  return {
    platform,
    projects,
    loading,
    hasMore,
    total,
    filters,
    loadMore,
    setPlatform,
    scrollTop,
    setScrollTop,
    updateProjectFavorite,
    setFilters,
    refresh,
  };
};

const ProjectPage: React.FC = () => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const restoredScrollRef = useRef(false);
  const navigate = useNavigate();
  const backTopTarget = useCallback(() => window, []);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [primaryFilterOptions, setPrimaryFilterOptions] = useState(createInitialPrimaryOptions);
  const [childrenFilterOptions, setChildrenFilterOptions] = useState(createInitialChildrenOptions);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      PROJECT_FILTER_FIELDS.map((field) => ({
        key: field.datasetKey,
        label: field.label,
        multiple: field.multiple,
      })),
    [],
  );
  const convertFiltersToParams = useCallback(
    (selection: ProjectFilterSelectionState): Partial<ProjectListParams> => {
      const params: Partial<ProjectListParams> = {};
      PROJECT_FILTER_FIELDS.forEach((field) => {
        const values = selection[field.datasetKey] ?? [];
        if (!values || values.length === 0) {
          return;
        }
        (params as Record<string, unknown>)[field.requestKey] = values;
      });
      return params;
    },
    [],
  );
  const {
    platform,
    projects,
    loading,
    hasMore,
    total,
    filters,
    loadMore,
    setPlatform,
    scrollTop,
    setScrollTop,
    updateProjectFavorite,
    setFilters,
    refresh,
  } =
    useInfinityProjects(convertFiltersToParams);
  const [favoritePending, setFavoritePending] = useState<Record<string, boolean>>({});
  const gridClassName = useMemo(() => {
    if (platform === 'ios') {
      return 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';
    }

    return 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2';
  }, [platform]);

  const activeFilterCount = useMemo(() => {
    return PROJECT_FILTER_FIELDS.reduce((count, field) => {
      const values = filters[field.datasetKey] ?? [];
      if (!values || values.length === 0) {
        return count;
      }
      return count + values.length;
    }, 0);
  }, [filters]);

  useEffect(() => {
    let active = true;
    setFiltersLoading(true);
    getProjectFilters()
      .then((response) => {
        if (!active) {
          return;
        }
        const nextPrimary = createInitialPrimaryOptions();
        response.data.categories.forEach((category) => {
          const datasetKey = category.key as ProjectFilterDatasetKey;
          if (!findProjectFilterFieldConfig(datasetKey)) {
            return;
          }
          nextPrimary[datasetKey] = category.options ?? [];
        });
        setPrimaryFilterOptions(nextPrimary);
        setChildrenFilterOptions(createInitialChildrenOptions());
      })
      .catch((error) => {
        console.error('获取项目筛选项失败', error);
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

  const handleFetchChildrenOptions = useCallback(
    async (dataset: string, parent: string) => {
      const datasetKey = dataset as ProjectFilterDatasetKey;
      if (!findProjectFilterFieldConfig(datasetKey)) {
        return [] as string[];
      }
      try {
        const response = await getProjectFilters({ category: datasetKey, parent });
        const options = response.data.categories[0]?.options ?? [];
        setChildrenFilterOptions((prev) => ({
          ...prev,
          [datasetKey]: {
            ...(prev[datasetKey] ?? {}),
            [parent]: options,
          },
        }));
        return options;
      } catch (error) {
        console.error('获取项目子筛选项失败', error);
        setChildrenFilterOptions((prev) => ({
          ...prev,
          [datasetKey]: {
            ...(prev[datasetKey] ?? {}),
            [parent]: [],
          },
        }));
        return [];
      }
    },
    [],
  );

  const handleFilterApply = (selection: FilterSelectionState) => {
    const nextSelection = selection as ProjectFilterSelectionState;
    setFilters(nextSelection);
    refresh(nextSelection);
  };

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

  useEffect(() => {
    setFavoritePending({});
  }, [platform, filters]);

  const handleProjectFavoriteToggle = useCallback(
    async (projectId: string, nextFavorite: boolean) => {
      setFavoritePending((prev) => ({
        ...prev,
        [projectId]: true,
      }));

      if (nextFavorite) {
        await favoriteProject(projectId);
      } else {
        await unfavoriteProject(projectId);
      }
      updateProjectFavorite(projectId, nextFavorite);
      setFavoritePending((prev) => {
        const nextState = { ...prev };
        delete nextState[projectId];
        return nextState;
      });
    },
    [updateProjectFavorite],
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

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Segmented
            size="large"
            options={platformOptions}
            value={platform}
            onChange={handlePlatformChange}
            className="rounded-full border border-gray-200 bg-white shadow-sm"
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
            isFavorite={project.isFavorite ?? false}
            favoritePending={Boolean(favoritePending[project.projectId])}
            onToggleFavorite={(next) => {
              void handleProjectFavoriteToggle(project.projectId, next);
            }}
          />
        ))}
      </section>

      {projects.length === 0 && !loading ? (
        <Empty description="暂无项目" className="py-16" />
      ) : null}

      <div className="flex justify-center">
        {loading ? <Spin tip="加载中" /> : null}
      </div>

      {!hasMore && projects.length > 0 ? (
        <p className="text-center text-sm text-gray-400">
          已展示全部 {total} 个项目
        </p>
      ) : null}

      <div ref={sentinelRef} className="h-1" />

      <BackTop visibilityHeight={240} target={backTopTarget} />
      <FilterModal
        open={filterModalOpen}
        loading={filtersLoading}
        fields={filterFields}
        primaryOptions={primaryFilterOptions}
        childrenOptions={childrenFilterOptions}
        value={filters}
        onFetchChildren={handleFetchChildrenOptions}
        onApply={handleFilterApply}
        onClose={() => setFilterModalOpen(false)}
      />
    </div>
  );
};

export default ProjectPage;
