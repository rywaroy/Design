import { useEffect, useRef } from 'react';
import type { ChatConversationMessage } from '../types';
import { scrollToBottom } from '../utils';

const useAutoScroll = (
  containerRef: React.RefObject<HTMLDivElement>,
  messages: ChatConversationMessage[],
) => {
  const previousSizeRef = useRef(0);
  const previousGapRef = useRef(0);
  const resizeFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateGap = () => {
      const { scrollTop, clientHeight, scrollHeight } = container;
      previousGapRef.current = scrollHeight - (scrollTop + clientHeight);
    };

    updateGap();
    container.addEventListener('scroll', updateGap, { passive: true });
    return () => {
      container.removeEventListener('scroll', updateGap);
    };
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const previousSize = previousSizeRef.current;
    const previousGap = previousGapRef.current;
    const currentSize = messages.length;

    if (currentSize === 0) {
      previousSizeRef.current = 0;
      previousGapRef.current = 0;
      return;
    }

    const getGap = () => {
      const { scrollTop, clientHeight, scrollHeight } = container;
      return scrollHeight - (scrollTop + clientHeight);
    };

    const currentGap = getGap();
    const wasNearBottom = previousGap < 120;
    const wasAtBottom = previousGap < 4;
    const isAtBottom = currentGap < 4;

    const ensure = () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
      let run = 0;
      const step = () => {
        const target = containerRef.current;
        if (!target) {
          return;
        }
        scrollToBottom(target);
        run += 1;
        if (run < 4) {
          resizeFrameRef.current = requestAnimationFrame(step);
        } else {
          resizeFrameRef.current = null;
        }
      };
      scrollToBottom(container);
      resizeFrameRef.current = requestAnimationFrame(step);
    };

    const isAppending = currentSize > previousSize;
    if (isAppending) {
      if (wasNearBottom || previousSize === 0) {
        ensure();
      }
    } else if (currentSize === previousSize && (wasAtBottom || isAtBottom)) {
      ensure();
    }

    previousSizeRef.current = currentSize;
    previousGapRef.current = getGap();
  }, [containerRef, messages]);
};

export default useAutoScroll;
