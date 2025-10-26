import { useState, useCallback } from "react";

export const useLoaderManagers = <T extends readonly string[]>(
  ...stateNames: T
) => {
  const [loading, setLoading] = useState<Record<T[number], boolean>>(
    Object.fromEntries(stateNames.map((name) => [name, false])) as Record<
      T[number],
      boolean
    >
  );

  type ModalName = T[number];

  const toggle = useCallback((name: ModalName) => {
    setLoading((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  return { loading, toggle };
};
