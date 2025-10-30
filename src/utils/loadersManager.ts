import { useState, useCallback } from "react";

export const useLoadingStates = <T extends readonly string[]>(
  ...stateNames: T
) => {
  const [loading, setLoading] = useState<Record<T[number], boolean>>(
    Object.fromEntries(stateNames.map((name) => [name, false])) as Record<
      T[number],
      boolean
    >
  );

  type LoaderName = T[number];

  const setLoadingOn = useCallback((name: LoaderName) => {
    setLoading((prev) => ({ ...prev, [name]: true }));
  }, []);

  const setLoadingOff = useCallback((name: LoaderName) => {
    setLoading((prev) => ({ ...prev, [name]: false }));
  }, []);

  const toggleLoading = useCallback((name: LoaderName) => {
    setLoading((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  return { loading, setLoadingOn, setLoadingOff, toggleLoading };
};
