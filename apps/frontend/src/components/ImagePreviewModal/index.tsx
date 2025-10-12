import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftOutlined, ArrowRightOutlined, CloseOutlined } from '@ant-design/icons';

export interface ImagePreviewModalProps {
  open: boolean;
  images: string[];
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

const ImagePreviewModal: FC<ImagePreviewModalProps> = ({ open, images, initialIndex = 0, onClose }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(clampIndex(initialIndex, images.length));

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    setContainer(document.body);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCurrentIndex(clampIndex(initialIndex, images.length));
  }, [open, initialIndex, images.length]);

  useEffect(() => {
    if (!open || !container) {
      return;
    }

    const originalOverflow = container.style.overflow;
    container.style.overflow = 'hidden';

    return () => {
      container.style.overflow = originalOverflow;
    };
  }, [container, open]);

  const hasImages = images.length > 0;
  const imageSrc = useMemo(() => {
    if (!hasImages) {
      return '';
    }
    return images[clampIndex(currentIndex, images.length)];
  }, [currentIndex, images]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePrev = useCallback(() => {
    if (!hasImages || images.length <= 1) {
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [hasImages, images.length]);

  const handleNext = useCallback(() => {
    if (!hasImages || images.length <= 1) {
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [hasImages, images.length]);

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

  if (!open || !container || !hasImages) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div
        className="relative flex h-[95vh] w-[95vw] max-w-[95vw] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
      >
        <button
          type="button"
          aria-label="关闭预览"
          className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-gray-600 transition hover:bg-black/10"
          onClick={handleClose}
        >
          <CloseOutlined className="text-base" />
        </button>

        <div className="relative flex flex-1 items-center justify-center bg-white overflow-hidden">
          <div className="flex h-[95%] w-[95%] items-center justify-center">
            <img
              src={imageSrc}
              alt="预览图片"
              className="max-h-[90%] max-w-[90%] rounded-[24px] object-contain"
            />
          </div>

          {images.length > 1 ? (
            <>
              <div className="pointer-events-none absolute left-8 top-1/2 flex -translate-y-1/2 items-center">
                <button
                  type="button"
                  aria-label="上一张"
                  className="pointer-events-auto flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg opacity-90 transition hover:bg-white"
                  onClick={handlePrev}
                >
                  <ArrowLeftOutlined className="text-lg" />
                </button>
              </div>
              <div className="pointer-events-none absolute right-8 top-1/2 flex -translate-y-1/2 items-center">
                <button
                  type="button"
                  aria-label="下一张"
                  className="pointer-events-auto flex h-12 w-12 translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg opacity-90 transition hover:bg-white"
                  onClick={handleNext}
                >
                  <ArrowRightOutlined className="text-lg" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    container,
  );
};

export default ImagePreviewModal;
