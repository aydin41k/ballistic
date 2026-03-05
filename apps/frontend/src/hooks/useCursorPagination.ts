"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CursorPageShape<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

interface UseCursorPaginationResult<T> {
  items: T[];
  /** True while any fetch (initial or subsequent page) is in flight. */
  loading: boolean;
  /** True only during the very first fetch — use to show a skeleton, not a spinner. */
  initialLoading: boolean;
  /** True if the server says there are more pages. */
  hasMore: boolean;
  /** Non-null if the last fetch failed. Cleared on the next successful fetch. */
  error: string | null;
  /** Fetch the next page. No-op if already loading or hasMore is false. */
  loadMore: () => void;
  /** Discard all loaded pages and re-fetch from the start. */
  reset: () => void;
  /**
   * Mutate the accumulated items in place (e.g. to optimistically mark a
   * notification as read without re-fetching the whole list).
   */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Generic cursor-paginated feed hook.
 *
 * Accepts a fetcher that returns `{ data, next_cursor, has_more }` and
 * accumulates results across pages. Designed for infinite-scroll UIs —
 * call `loadMore()` when a sentinel element intersects the viewport.
 *
 * The hook guards against:
 *   - Concurrent loadMore() calls (single in-flight request at a time)
 *   - Stale responses overwriting fresher state after a reset() (generation guard)
 *   - Fetching past the last page (early-out on !hasMore)
 *
 * @param fetcher (cursor) => Promise<page>. Called with undefined for page 1.
 * @param enabled When false, the hook stays idle (useful to defer the first
 *                fetch until e.g. a modal opens).
 */
export function useCursorPagination<T>(
  fetcher: (cursor?: string) => Promise<CursorPageShape<T>>,
  enabled: boolean = true,
): UseCursorPaginationResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Incremented on every reset() so an in-flight response for an earlier
  // generation is discarded instead of clobbering fresh state.
  const generationRef = useRef(0);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(
    async (pageCursor: string | undefined, isFirst: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const gen = generationRef.current;

      try {
        const page = await fetcher(pageCursor);

        // Stale response — a reset() happened while we were waiting.
        if (gen !== generationRef.current) return;

        setItems((prev) => (isFirst ? page.data : [...prev, ...page.data]));
        setCursor(page.next_cursor);
        setHasMore(page.has_more);
      } catch (e) {
        if (gen !== generationRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (gen === generationRef.current) {
          setLoading(false);
          setInitialLoading(false);
        }
        loadingRef.current = false;
      }
    },
    [fetcher],
  );

  // Kick off the first page when enabled.
  useEffect(() => {
    if (!enabled) {
      setInitialLoading(false);
      return;
    }
    generationRef.current += 1;
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setInitialLoading(true);
    void fetchPage(undefined, true);
  }, [enabled, fetchPage]);

  const loadMore = useCallback(() => {
    if (!enabled || loadingRef.current || !hasMore || cursor === null) return;
    void fetchPage(cursor, false);
  }, [enabled, hasMore, cursor, fetchPage]);

  const reset = useCallback(() => {
    generationRef.current += 1;
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);
    if (enabled) {
      void fetchPage(undefined, true);
    }
  }, [enabled, fetchPage]);

  return {
    items,
    loading,
    initialLoading,
    hasMore,
    error,
    loadMore,
    reset,
    setItems,
  };
}
