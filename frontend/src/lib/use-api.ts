"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";

type State<T> = { data: T | null; error: ApiError | null; loading: boolean };

export function useApi<T>(path: string | null) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: path !== null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let live = true;
    apiFetch<T>(path).then(
      (data) => live && setState({ data, error: null, loading: false }),
      (e) => live && setState({ data: null, error: e instanceof ApiError ? e : new ApiError(0, e), loading: false }),
    );
    return () => { live = false; };
  }, [path, tick]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setTick((n) => n + 1);
  }, []);
  return { ...state, loading: path !== null && state.loading, reload };
}
