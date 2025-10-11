import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Skeleton } from 'antd';
import type { Project } from '@design/shared-types';
import { resolveAssetUrl } from '../../lib/asset';

export interface ProjectCardProps {
  project: Project;
  className?: string;
  onClick?: (projectId: string) => void;
}

const combineClassName = (base: string, extra?: string) => {
  return extra ? `${base} ${extra}` : base;
};

const isActivationKey = (key: string) => key === 'Enter' || key === ' ';

const ProjectCard: React.FC<ProjectCardProps> = ({ project, className, onClick }) => {
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const screens = useMemo(() => project.previewScreens ?? [], [project.previewScreens]);

  useEffect(() => {
    setActiveScreenIndex(0);
    setPreviewLoaded(false);
    setPreviewFailed(false);
  }, [project.projectId]);

  const currentScreen = screens[activeScreenIndex];
  const screenUrl = resolveAssetUrl(currentScreen) ?? currentScreen ?? null;
  const logoUrl = resolveAssetUrl(project.appLogoUrl) ?? project.appLogoUrl ?? null;

  useEffect(() => {
    if (screenUrl) {
      setPreviewLoaded(false);
      setPreviewFailed(false);
    } else {
      setPreviewLoaded(true);
      setPreviewFailed(true);
    }
  }, [screenUrl]);

  useEffect(() => {
    if (logoUrl) {
      setLogoLoaded(false);
      setLogoFailed(false);
    } else {
      setLogoLoaded(true);
      setLogoFailed(true);
    }
  }, [logoUrl]);

  const hasScreens = screens.length > 0;
  const isIos = project.platform === 'ios';
  const articleBaseClass = 'flex flex-col gap-5 rounded-3xl shadow-sm ring-1 ring-gray-100';
  const articleVariantClass = isIos
    ? 'bg-[#f1f1f1] px-6 pt-5 pb-5 mx-auto w-full max-w-[340px] rounded-[36px] place-self-center sm:max-w-[360px] sm:rounded-[40px]'
    : 'bg-[#f1f1f1] p-4 sm:p-5';
  const previewBaseClass = 'group relative overflow-hidden rounded-[28px]';
  const previewVariantClass = isIos
    ? 'bg-[#f1f1f1] px-6 pt-6 pb-6 mx-auto w-full max-w-[280px] rounded-[32px] sm:px-8 sm:pt-8 sm:pb-8 sm:rounded-[36px] aspect-[9/19.5]'
    : 'bg-[#f1f1f1] p-3 sm:p-4 aspect-[16/10]';

  const metaRowExtraClass = isIos ? 'w-full px-2 sm:px-4' : undefined;
  const previewImageClass = isIos
    ? 'h-full w-full rounded-[24px] object-cover sm:rounded-[28px]'
    : 'h-full w-full rounded-[16px] object-cover sm:rounded-[20px]';
  const prevButtonPositionClass = isIos ? 'left-9 sm:left-[-12px]' : 'left-4 sm:left-5';
  const nextButtonPositionClass = isIos ? 'right-9 sm:right-[-12px]' : 'right-4 sm:right-5';
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

  const clickable = typeof onClick === 'function';

  const handleCardClick = () => {
    if (!clickable) {
      return;
    }
    onClick(project.projectId);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!clickable || !isActivationKey(event.key)) {
      return;
    }
    event.preventDefault();
    onClick(project.projectId);
  };

  const containerClassName = combineClassName(
    `${articleBaseClass} ${articleVariantClass}`,
    className,
  );

  const interactiveClassName = clickable
    ? 'cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-800'
    : '';

  return (
    <article
      className={combineClassName(containerClassName, interactiveClassName)}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div
        className={`${previewBaseClass} ${previewVariantClass}`}
      >
        {hasScreens && screenUrl && !previewFailed ? (
          <div className="relative h-full w-full">
            {!previewLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Skeleton.Image
                  active
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: isIos ? 24 : 16,
                  }}
                />
              </div>
            ) : null}

            <img
              src={screenUrl}
              alt={`${project.name} preview ${activeScreenIndex + 1}`}
              loading="lazy"
              decoding="async"
              className={`${previewImageClass} transition-opacity duration-300 ${
                previewLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => {
                setPreviewLoaded(true);
              }}
              onError={() => {
                setPreviewLoaded(true);
                setPreviewFailed(true);
              }}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            暂无预览
          </div>
        )}

        {screens.length > 1 ? (
          <>
            <div className="absolute right-0 top-[-4px] flex items-center gap-1">
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
              className={`pointer-events-none absolute ${prevButtonPositionClass} top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-gray-700 shadow-md opacity-0 transition-opacity duration-200 hover:bg-white group-hover:pointer-events-auto group-hover:opacity-100`}
              onClick={(event) => {
                event.stopPropagation();
                handlePrev();
              }}
            >
              <ArrowLeftOutlined className="text-lg" />
            </button>
            <button
              type="button"
              aria-label="下一张预览"
              className={`pointer-events-none absolute ${nextButtonPositionClass} top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-gray-700 shadow-md opacity-0 transition-opacity duration-200 hover:bg-white group-hover:pointer-events-auto group-hover:opacity-100`}
              onClick={(event) => {
                event.stopPropagation();
                handleNext();
              }}
            >
              <ArrowRightOutlined className="text-lg" />
            </button>
          </>
        ) : null}
      </div>

      <div className={combineClassName('flex items-center gap-3', metaRowExtraClass)}>
        {logoUrl && !logoFailed ? (
          <div className="relative h-12 w-12">
            {!logoLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton.Avatar
                  active
                  size={48}
                  shape="square"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 16,
                  }}
                />
              </div>
            ) : null}
            <img
              src={logoUrl}
              alt={`${project.appName} logo`}
              loading="lazy"
              decoding="async"
              className={`h-12 w-12 rounded-2xl object-cover transition-opacity duration-300 ${
                logoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => {
                setLogoLoaded(true);
              }}
              onError={() => {
                setLogoLoaded(true);
                setLogoFailed(true);
              }}
            />
          </div>
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
