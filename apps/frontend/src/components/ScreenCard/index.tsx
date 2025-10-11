import type { FC, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Skeleton } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

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
}) => {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const hasCover = Boolean(coverUrl);
  const clickable = typeof onClick === 'function';
  const hasActions = actions.length > 0;
  const variantConfig = variantClassMap[variant] ?? variantClassMap.ios;
  const shouldShowCover = hasCover && !coverFailed;
  const coverImgRef = useRef<HTMLImageElement | null>(null);

  const coverSrc = useMemo(() => {
    if (!coverUrl) {
      return null;
    }
    if (reloadToken === 0) {
      return coverUrl;
    }
    const connector = coverUrl.includes('?') ? '&' : '?';
    return `${coverUrl}${connector}_r=${reloadToken}`;
  }, [coverUrl, reloadToken]);

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
    if (!coverUrl) {
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

  return (
    <div
      className={combineClassName(
        `group relative w-full overflow-hidden bg-gray-100 ${variantConfig.aspect} ${variantConfig.radius}`,
        className,
      )}
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
          {actions.map((action) => (
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
    </div>
  );
};

export default ScreenCard;
