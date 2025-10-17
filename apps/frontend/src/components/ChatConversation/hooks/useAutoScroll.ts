import { useEffect, useRef } from 'react';
import type { ChatConversationMessage } from '../types';
import { scrollToBottom } from '../utils';

export const useAutoScroll = (
  containerRef: React.RefObject<HTMLDivElement>,
  messages: ChatConversationMessage[],
) => {
  const previousSizeRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const previousSize = previousSizeRef.current;
    const currentSize = messages.length;

    previousSizeRef.current = currentSize;

    if (currentSize === 0) return;

    const isAppending = currentSize > previousSize;
    const { scrollTop, clientHeight, scrollHeight } = container;
    const gap = scrollHeight - (scrollTop + clientHeight);
    const isNearBottom = gap < 120;
    const isAtBottom = gap < 4;

    if (isAppending) {
      if (isNearBottom || previousSize === 0) {
        scrollToBottom(container);
      }
      return;
    }

    // in-place updates (e.g., replace loading with response)
    if (currentSize === previousSize && isAtBottom) {
      scrollToBottom(container);
    }
  }, [containerRef, messages]);
};

export default useAutoScroll;
