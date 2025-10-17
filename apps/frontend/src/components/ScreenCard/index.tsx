import type { FC, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Skeleton } from 'antd';
import { CheckOutlined, HeartFilled, HeartOutlined, ReloadOutlined } from '@ant-design/icons';
import { appendImageResizeParam } from '../../lib/asset';
import ImagePreviewModal, { type ScreenPreviewItem } from '../ImagePreviewModal';

const combineClassName = (base: string, extra?: string) => {
  return extra ? `${base} ${extra}` : base;
};

const isActivationKey = (key: string) => key === 'Enter' || key === ' ';

export interface ScreenCardAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

export type ScreenCardVariant = 'ios' | 'web';

export interface ScreenCardProps {
  coverUrl?: string | null;
  fallbackText?: string;
  className?: string;
  actions?: ScreenCardAction[];
  onClick?: () => void;
  variant?: ScreenCardVariant;
  preview?: {
    screens: ScreenPreviewItem[];
    initialIndex?: number;
  };
  isFavorite?: boolean;
  onToggleFavorite?: (next: boolean) => void;
  favoritePending?: boolean;
  isRecommended?: boolean;
  selected?: boolean;
}

const variantClassMap: Record<ScreenCardVariant, { aspect: string; radius: string }> = {
  ios: {
    aspect: 'aspect-[9/19.5]',
    radius: 'rounded-[36px]',
  },
  web: {
    aspect: 'aspect-[16/10]',
    radius: 'rounded-[24px]',
  },
};

const ScreenCard: FC<ScreenCardProps> = ({
  coverUrl,
  fallbackText = '暂无预览',
  className,
  actions = [],
  onClick,
  variant = 'ios',
  preview,
  isFavorite: isFavoriteProp,
  onToggleFavorite,
  favoritePending = false,
  isRecommended = false,
  selected: selectedProp = false,
}) => {
  const variantWidth = variant === 'ios' ? 400 : 600;
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [favoriteAnimating, setFavoriteAnimating] = useState(false);
  const previewEnabled = Boolean(preview?.screens?.length);
  const clickable = typeof onClick === 'function' || previewEnabled;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(preview?.initialIndex ?? 0);
  const coverImgRef = useRef<HTMLImageElement | null>(null);
  const favoriteAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFavorite = isFavoriteProp ?? false;
  const selected = selectedProp;
  const adjustedCoverUrl = useMemo(() => {
    if (!coverUrl) {
      return null;
    }
    return appendImageResizeParam(coverUrl, variantWidth);
  }, [coverUrl, variantWidth]);
  const hasCover = Boolean(adjustedCoverUrl);
  const shouldShowCover = hasCover && !coverFailed;
  const variantConfig = variantClassMap[variant] ?? variantClassMap.ios;

  const coverSrc = useMemo(() => {
    if (!adjustedCoverUrl) {
      return null;
    }
    if (reloadToken === 0) {
      return adjustedCoverUrl;
    }
    const connector = adjustedCoverUrl.includes('?') ? '&' : '?';
    return `${adjustedCoverUrl}${connector}_r=${reloadToken}`;
  }, [adjustedCoverUrl, reloadToken]);

  useEffect(() => {
    if (coverSrc) {
      setCoverLoaded(false);
      setCoverFailed(false);
      const img = coverImgRef.current;
      if (img?.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setCoverLoaded(true);
      }
    } else {
      setCoverLoaded(true);
      setCoverFailed(true);
    }
  }, [coverSrc]);

  const handleCoverReload = (event: MouseEvent) => {
    event.stopPropagation();
    if (!adjustedCoverUrl) {
      return;
    }
    setCoverLoaded(false);
    setCoverFailed(false);
    setReloadToken((token) => token + 1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!clickable || !isActivationKey(event.key)) {
      return;
    }
    event.preventDefault();
    if (previewEnabled) {
      handlePreview();
    }
    onClick?.();
  };

  const resolvePreviewIndex = () => {
    if (!previewEnabled) {
      return 0;
    }
    const total = preview!.screens.length;
    if (total === 0) {
      return 0;
    }
    if (typeof preview?.initialIndex === 'number') {
      const index = preview.initialIndex;
      if (index < 0) {
        return 0;
      }
      if (index >= total) {
        return total - 1;
      }
      return index;
    }
    if (coverUrl) {
      const foundIndex = preview!.screens.findIndex((screen) => {
        const candidates = [screen.previewUrl, screen.url, screen.originalUrl];
        return candidates.some((candidate) => candidate === coverUrl);
      });
      if (foundIndex >= 0) {
        return foundIndex;
      }
    }
    return 0;
  };

  const handlePreview = () => {
    if (!previewEnabled) {
      return;
    }
    setPreviewIndex(resolvePreviewIndex());
    setPreviewOpen(true);
  };

  const handleCardClick = () => {
    if (previewEnabled) {
      handlePreview();
    }
    onClick?.();
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  const favoriteButtonVisibility = isFavorite
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100';

  const triggerFavoriteAnimation = () => {
    if (favoriteAnimationTimerRef.current) {
      clearTimeout(favoriteAnimationTimerRef.current);
    }
    setFavoriteAnimating(true);
    favoriteAnimationTimerRef.current = setTimeout(() => {
      setFavoriteAnimating(false);
      favoriteAnimationTimerRef.current = null;
    }, 260);
  };

  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (favoritePending) {
      return;
    }
    triggerFavoriteAnimation();
    onToggleFavorite?.(!isFavorite);
  };

  useEffect(() => {
    return () => {
      if (favoriteAnimationTimerRef.current) {
        clearTimeout(favoriteAnimationTimerRef.current);
      }
    };
  }, []);

  const finalActions = actions;
  const hasActions = finalActions.length > 0;

  const selectedBorderClass = selected
    ? 'border-[#2563EB]'
    : isRecommended
      ? 'border-yellow-400'
      : 'border-transparent';

  return (
    <div
      className={combineClassName(
        `group relative w-full overflow-hidden bg-gray-100 ${variantConfig.aspect} ${variantConfig.radius} ${
          clickable ? 'cursor-pointer' : ''
        } border-2 ${selectedBorderClass}`,
        className,
      )}
      style={{ maxWidth: variantWidth, 'transition': 'all 0.3s ease-out' }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      {selected ? (
        <span className="pointer-events-none absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg text-base">
          <CheckOutlined />
        </span>
      ) : null}
      <button
        type="button"
        aria-label={isFavorite ? '取消收藏页面' : '收藏页面'}
        aria-pressed={isFavorite}
        disabled={favoritePending}
        className={`absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg shadow-lg transition-all duration-200 ${favoriteButtonVisibility} ${
          favoritePending ? 'cursor-wait opacity-70' : 'cursor-pointer hover:scale-110 active:scale-95'
        } ${isFavorite ? '!text-[#ED3F27]' : 'text-gray-500'} ${
          favoriteAnimating ? 'animate-favorite-bounce' : ''
        }`}
        onClick={handleFavoriteClick}
      >
        {isFavorite ? <HeartFilled /> : <HeartOutlined />}
      </button>
      {isRecommended && !selected ? (
        <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-yellow-300/95 px-3 py-1 text-xs font-semibold text-yellow-900 shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          AI 推荐
        </span>
      ) : null}
      {shouldShowCover ? (
        <div className="relative h-full w-full">
          {!coverLoaded ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100">
              <Skeleton.Image
                active
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: variant === 'web' ? 24 : 36,
                }}
              />
            </div>
          ) : null}
          <img
            src={coverSrc!}
            alt="screen preview"
            loading="lazy"
            decoding="async"
            ref={coverImgRef}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              coverLoaded && !coverFailed ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => {
              setCoverLoaded(true);
            }}
            onError={() => {
              setCoverLoaded(true);
              setCoverFailed(true);
            }}
          />
          {coverFailed ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/95">
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm text-gray-500">图片加载失败</span>
                <Button size="small" icon={<ReloadOutlined />} onClick={handleCoverReload}>
                  重试
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm text-gray-500">{fallbackText}</span>
            {coverUrl ? (
              <Button size="small" icon={<ReloadOutlined />} onClick={handleCoverReload}>
                重试
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {hasActions ? (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-3 pb-4 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          {finalActions.map((action) => (
            <button
              key={action.key}
              type="button"
              aria-label={action.label}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-lg text-gray-700 shadow-md transition hover:bg-white cursor-pointer"
              onClick={(event) => {
                event.stopPropagation();
                action.onClick();
              }}
            >
              {action.icon ?? <span className="text-sm font-medium">{action.label}</span>}
              {action.icon ? <span className="sr-only">{action.label}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      {previewEnabled ? (
        <ImagePreviewModal open={previewOpen} screens={preview!.screens} initialIndex={previewIndex} onClose={handlePreviewClose} />
      ) : null}
    </div>
  );
};

export default ScreenCard;
