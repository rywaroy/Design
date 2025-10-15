import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { message, Modal, Spin, Empty } from 'antd';
import { CloseCircleFilled, SearchOutlined } from '@ant-design/icons';
import type { ProjectListItem, ProjectPlatform } from '../../../../services/project';
import { searchProjectsWithAI } from '../../../../services/project';
import ProjectCard from '../../../../components/ProjectCard';

interface AISearchProps {
  open: boolean;
  platform: ProjectPlatform;
  onClose: () => void;
  onProjectClick: (projectId: string) => void;
  onToggleFavorite: (projectId: string, nextFavorite: boolean) => Promise<void> | void;
  favoritePending: Record<string, boolean>;
}

const AISearch: React.FC<AISearchProps> = ({
  open,
  platform,
  onClose,
  onProjectClick,
  onToggleFavorite,
  favoritePending,
}) => {
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [searched, setSearched] = useState(false);
  const gridClassName = useMemo(() => {
    if (platform === 'ios') {
      return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
    }

    return 'grid grid-cols-1 gap-4 sm:grid-cols-2';
  }, [platform]);

  useEffect(() => {
    if (!open) {
      setRequirement('');
      setProjects([]);
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
      const response = await searchProjectsWithAI({
        requirement: trimmed,
        platform,
      });
      const { search } = response.data;
      const items = search.items ?? [];
      setProjects(items);
    } catch (err) {
      console.error('AI 搜索失败', err);
      setProjects([]);
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
    async (projectId: string, nextFavorite: boolean) => {
      await onToggleFavorite(projectId, nextFavorite);
      setProjects((prev) =>
        prev.map((project) =>
          project.projectId === projectId
            ? { ...project, isFavorite: nextFavorite }
            : project,
        ),
      );
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
      className="project-ai-search-modal"
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
              placeholder="输入你的需求让 AI 推荐相关项目，例如：寻找一款支持团队协作的音乐软件"
              disabled={loading}
              className="w-full border-none bg-transparent text-lg text-gray-700 placeholder:text-gray-400 outline-none focus:outline-none"
              autoFocus
            />
            {requirement ? (
              <button
                type="button"
                onClick={() => setRequirement('')}
                className="!text-gray-400 transition cursor-pointer"
                aria-label="清空输入"
              >
                <CloseCircleFilled />
              </button>
            ) : null}
          </div>
          {loading || searched ? (
            <>
              <div className="max-h-[520px] overflow-y-auto px-8 pb-8 pt-6 border-t border-gray-300">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spin tip="AI 搜索中" />
                </div>
              ) : projects.length > 0 ? (
                <div className={gridClassName}>
                  {projects.map((project) => (
                    <ProjectCard
                      key={`ai-${project.projectId}`}
                      project={project}
                      onClick={onProjectClick}
                      isFavorite={project.isFavorite ?? false}
                      favoritePending={Boolean(favoritePending[project.projectId])}
                      onToggleFavorite={(next) => {
                        void handleFavoriteToggle(project.projectId, next);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Empty description="AI 暂未找到匹配项目" className="py-16" />
              )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export default AISearch;
