import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { Project } from '@design/shared-types';
import { RESOURCE_BASE_URL } from '../../lib/constant';

export interface ProjectCardProps {
  project: Project;
  className?: string;
}

const resolveAssetUrl = (path?: string | null): string | undefined => {
  if (!path) {
    return undefined;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${RESOURCE_BASE_URL}/${path.replace(/^\/+/, '')}`;
};

const combineClassName = (base: string, extra?: string) => {
  return extra ? `${base} ${extra}` : base;
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, className }) => {
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const screens = useMemo(() => project.previewScreens ?? [], [project.previewScreens]);

  useEffect(() => {
    setActiveScreenIndex(0);
  }, [project.projectId]);

  const currentScreen = screens[activeScreenIndex];
  const hasScreens = screens.length > 0;
  const isWeb = project.platform === 'web';
  const isIos = project.platform === 'ios';
  const articleBaseClass = 'flex flex-col gap-5 rounded-3xl shadow-sm ring-1 ring-gray-100';
  const articleVariantClass = isIos
    ? 'bg-[#f1f1f1] px-6 pt-5 pb-5 mx-auto w-full max-w-[340px] rounded-[36px] place-self-center sm:max-w-[360px] sm:rounded-[40px]'
    : 'bg-[#f1f1f1] p-4 sm:p-5';
  const previewBaseClass = 'group relative rounded-[28px]';
  const previewVariantClass = isIos
    ? 'bg-[#f1f1f1] px-6 pt-6 pb-6 mx-auto w-full max-w-[280px] rounded-[32px] sm:px-8 sm:pt-8 sm:pb-8 sm:rounded-[36px]'
    : 'bg-[#f1f1f1] p-3 sm:p-4';

  const metaRowExtraClass = isIos ? 'w-full px-2 sm:px-4' : undefined;
  const previewImageClass = isIos
    ? 'h-full w-full object-cover rounded-[24px] sm:rounded-[28px]'
    : 'h-full w-full object-cover rounded-[16px] sm:rounded-[20px]';
  const prevButtonPositionClass = isIos ? 'left-9 sm:left-[-12px]' : 'left-4 sm:left-5';
  const nextButtonPositionClass = isIos ? 'right-9 sm:right-[-12px]' : 'right-4 sm:right-5';
  const navigationCursorClass = 'group-hover:cursor-pointer';
  const handlePrev = () => {
    if (screens.length <= 1) {
      return;
    }
    setActiveScreenIndex((index) => (index - 1 + screens.length) % screens.length);
  };

  const handleNext = () => {
    if (screens.length <= 1) {
      return;
    }
    setActiveScreenIndex((index) => (index + 1) % screens.length);
  };

  const screenUrl = resolveAssetUrl(currentScreen) ?? currentScreen;
  const logoUrl = resolveAssetUrl(project.appLogoUrl) ?? project.appLogoUrl;

  return (
    <article
      className={combineClassName(`${articleBaseClass} ${articleVariantClass}`, className)}
    >
      <div
        className={`${previewBaseClass} ${previewVariantClass}`}
      >
        {hasScreens && screenUrl ? (
          <img
            src={screenUrl}
            alt={`${project.name} preview ${activeScreenIndex + 1}`}
            loading="lazy"
            decoding="async"
            className={previewImageClass}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            暂无预览
          </div>
        )}

        {screens.length > 1 ? (
          <>
            <div className="absolute right-3 top-3 flex items-center gap-1">
              {screens.map((_, index) => (
                <span
                  key={`${project.projectId}-${index}`}
                  className={
                    index === activeScreenIndex
                      ? 'h-1.5 w-1.5 rounded-full bg-gray-900 transition-colors'
                      : 'h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors'
                  }
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="上一张预览"
              className={`pointer-events-none absolute ${prevButtonPositionClass} top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-gray-700 shadow-md opacity-0 transition-opacity duration-200 hover:bg-white group-hover:pointer-events-auto group-hover:opacity-100 ${navigationCursorClass}`}
              onClick={handlePrev}
            >
              <ArrowLeftOutlined className="text-lg" />
            </button>
            <button
              type="button"
              aria-label="下一张预览"
              className={`pointer-events-none absolute ${nextButtonPositionClass} top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-gray-700 shadow-md opacity-0 transition-opacity duration-200 hover:bg-white group-hover:pointer-events-auto group-hover:opacity-100 ${navigationCursorClass}`}
              onClick={handleNext}
            >
              <ArrowRightOutlined className="text-lg" />
            </button>
          </>
        ) : null}
      </div>

      <div className={combineClassName('flex items-center gap-3', metaRowExtraClass)}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${project.appName} logo`}
            loading="lazy"
            decoding="async"
            className="h-12 w-12 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-sm font-medium text-gray-500">
            {project.appName.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold text-gray-900">{project.appName}</span>
          {project.appTagline ? (
            <span className="text-sm text-gray-500">{project.appTagline}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
