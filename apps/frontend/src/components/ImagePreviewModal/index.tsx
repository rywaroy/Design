import type { FC, MouseEvent as ReactMouseEvent, SyntheticEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ScreenListItem } from '../../services/screen';
import { resolveAssetUrl } from '../../lib/asset';

export type ScreenPreviewItem = ScreenListItem & {
  previewUrl?: string;
};

export interface ImagePreviewModalProps {
  open: boolean;
  screens: ScreenPreviewItem[];
  initialIndex?: number;
  onClose: () => void;
}

const clampIndex = (index: number, total: number) => {
  if (total <= 0) {
    return 0;
  }
  if (index < 0) {
    return 0;
  }
  if (index >= total) {
    return total - 1;
  }
  return index;
};

const resolveScreenPreviewUrl = (screen: ScreenPreviewItem | undefined) => {
  if (!screen) {
    return '';
  }

  const candidates = [screen.previewUrl, screen.url, screen.originalUrl];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const resolved = resolveAssetUrl(candidate) ?? candidate;
    if (resolved) {
      return resolved;
    }
  }

  return '';
};

const openInNewTab = (url: string) => {
  if (!url || typeof window === 'undefined') {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

const extractFilename = (url: string) => {
  try {
    const base = typeof window !== 'undefined' ? window.location.href : undefined;
    const parsed = new URL(url, base);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return 'download';
    }
    return segments[segments.length - 1];
  } catch (_error) {
    return 'download';
  }
};

const downloadFile = async (url: string) => {
  if (!url || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = extractFilename(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.warn('下载原图失败，改为新窗口打开:', error);
    openInNewTab(url);
  }
};

const resolveDownloadUrl = (screen: ScreenPreviewItem | undefined) => {
  if (!screen) {
    return undefined;
  }
  const candidates = [screen.originalUrl, screen.url, screen.previewUrl];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const resolved = resolveAssetUrl(candidate) ?? candidate;
    if (resolved) {
      return resolved;
    }
  }
  return undefined;
};

const ImagePreviewModal: FC<ImagePreviewModalProps> = ({ open, screens, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(() => clampIndex(initialIndex, screens.length));

  useEffect(() => {
    if (!open) {
      return;
    }
    setCurrentIndex(clampIndex(initialIndex, screens.length));
  }, [open, initialIndex, screens.length]);

  const hasScreens = screens.length > 0;

  const currentScreen = useMemo(() => {
    if (!hasScreens) {
      return undefined;
    }
    return screens[clampIndex(currentIndex, screens.length)];
  }, [currentIndex, hasScreens, screens]);

  const imageSrc = useMemo(() => resolveScreenPreviewUrl(currentScreen), [currentScreen]);

  const downloadUrl = useMemo(() => resolveDownloadUrl(currentScreen), [currentScreen]);

  const handleClose = useCallback((event?: ReactMouseEvent<HTMLButtonElement> | SyntheticEvent) => {
    event?.stopPropagation();
    onClose();
  }, [onClose]);

  const handlePrev = useCallback(() => {
    if (!hasScreens || screens.length <= 1) {
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + screens.length) % screens.length);
  }, [hasScreens, screens.length]);

  const handleNext = useCallback(() => {
    if (!hasScreens || screens.length <= 1) {
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % screens.length);
  }, [hasScreens, screens.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev, open]);

  if (!hasScreens) {
    return null;
  }

  const isRecommended = Boolean(currentScreen?.isRecommended ?? currentScreen?.isAiRecommended);

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      closable={false}
      centered
      maskClosable={false}
      width="95vw"
      styles={{
        wrapper: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          background: 'transparent',
          padding: 0,
          boxShadow: 'none',
          maxWidth: '95vw',
          width: '100%',
        },
        body: {
          padding: 0,
        },
      }}
      rootClassName="image-preview-modal-root"
    >
      <div className="relative flex h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <button
          type="button"
          aria-label="关闭预览"
          className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-gray-600 transition hover:bg-black/10 cursor-pointer"
          onClick={handleClose}
        >
          <CloseOutlined className="text-base" />
        </button>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-white">
          <div className="flex h-[95%] w-[95%] items-center justify-center rounded-[28px] bg-white/90 p-2 transition-shadow">
            <img
              src={imageSrc}
              alt="预览图片"
              className={`max-h-[90%] max-w-[90%] rounded-[24px] object-contain ${
                isRecommended ? 'ring-4 ring-yellow-300/80' : ''
              }`}
            />
          </div>

          {screens.length > 1 ? (
            <>
              <div className="pointer-events-none absolute left-8 top-1/2 flex -translate-y-1/2 items-center">
                <button
                  type="button"
                  aria-label="上一张"
                  className="pointer-events-auto flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg opacity-90 transition hover:bg-white cursor-pointer"
                  onClick={handlePrev}
                >
                  <ArrowLeftOutlined className="text-lg" />
                </button>
              </div>
              <div className="pointer-events-none absolute right-8 top-1/2 flex -translate-y-1/2 items-center">
                <button
                  type="button"
                  aria-label="下一张"
                  className="pointer-events-auto flex h-12 w-12 translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg opacity-90 transition hover:bg-white cursor-pointer"
                  onClick={handleNext}
                >
                  <ArrowRightOutlined className="text-lg" />
                </button>
              </div>
            </>
          ) : null}
        </div>
        {downloadUrl ? (
          <div className="pointer-events-none absolute bottom-6 right-6 z-20">
            <button
              type="button"
              aria-label="下载原图"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-lg text-gray-700 shadow-lg transition hover:bg-white"
              onClick={() => {
                void downloadFile(downloadUrl);
              }}
            >
              <DownloadOutlined />
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

export default ImagePreviewModal;
