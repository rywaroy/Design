import type { FC, KeyboardEvent, ReactNode } from 'react';

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
  const hasCover = Boolean(coverUrl);
  const clickable = typeof onClick === 'function';
  const hasActions = actions.length > 0;
  const variantConfig = variantClassMap[variant] ?? variantClassMap.ios;

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
      {hasCover ? (
        <img
          src={coverUrl!}
          alt="screen preview"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
          {fallbackText}
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
