import type { FC, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Skeleton } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { appendImageResizeParam } from '../../lib/asset';
import ImagePreviewModal from '../ImagePreviewModal';

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
    images: string[];
    initialIndex?: number;
  };
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
}) => {
  const variantWidth = variant === 'ios' ? 400 : 600;
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const clickable = typeof onClick === 'function';
  const previewEnabled = Boolean(preview?.images?.length);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(preview?.initialIndex ?? 0);
  const coverImgRef = useRef<HTMLImageElement | null>(null);
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
    onClick?.();
  };

  const resolvePreviewIndex = () => {
    if (!previewEnabled) {
      return 0;
    }
    const total = preview!.images.length;
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
    if (adjustedCoverUrl) {
      const foundIndex = preview!.images.findIndex((url) => url === adjustedCoverUrl);
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

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  const finalActions = previewEnabled
    ? [
        ...actions,
        {
          key: 'screen-card-preview',
          label: '查看大图',
          icon: <EyeOutlined />,
          onClick: handlePreview,
        },
      ]
    : actions;

  const hasActions = finalActions.length > 0;

  return (
    <div
      className={combineClassName(
        `group relative w-full overflow-hidden bg-gray-100 ${variantConfig.aspect} ${variantConfig.radius}`,
        className,
      )}
      style={{ maxWidth: variantWidth }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => onClick?.()}
      onKeyDown={handleKeyDown}
    >
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 bg-black/0 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:bg-black/35 group-hover:opacity-100">
          {finalActions.map((action) => (
            <button
              key={action.key}
              type="button"
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-white"
              onClick={(event) => {
                event.stopPropagation();
                action.onClick();
              }}
            >
              {action.icon ?? null}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      {previewEnabled ? (
        <ImagePreviewModal open={previewOpen} images={preview!.images} initialIndex={previewIndex} onClose={handlePreviewClose} />
      ) : null}
    </div>
  );
};

export default ScreenCard;
