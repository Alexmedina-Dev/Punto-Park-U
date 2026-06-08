import { useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────

export interface UseRefreshControlReturn {
  refreshing: boolean;
  onRefresh: () => void;
  setRefreshing: (value: boolean) => void;
}

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Pull-to-refresh control hook.
 * Automatically resets refreshing after the async callback completes.
 *
 * @example
 * ```tsx
 * const { refreshing, onRefresh } = useRefreshControl(async () => {
 *   await fetchData();
 * });
 * // ...
 * <FlatList
 *   refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
 * />
 * ```
 */
export function useRefreshControl(
  onRefreshCallback?: () => Promise<void>
): UseRefreshControlReturn {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);

    if (onRefreshCallback) {
      onRefreshCallback().finally(() => {
        setRefreshing(false);
      });
    } else {
      // If no callback, keep refreshing for a minimum duration
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refreshing, onRefreshCallback]);

  return {
    refreshing,
    onRefresh,
    setRefreshing,
  };
}
