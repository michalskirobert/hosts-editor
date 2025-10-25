import { useState, useCallback } from "react";

export const useModalManager = <T extends readonly string[]>(
  ...stateNames: T
) => {
  const [modals, setModals] = useState<Record<T[number], boolean>>(
    Object.fromEntries(stateNames.map((name) => [name, false])) as Record<
      T[number],
      boolean
    >
  );

  type ModalName = T[number];

  const open = useCallback((name: ModalName) => {
    setModals((prev) => ({ ...prev, [name]: true }));
  }, []);

  const close = useCallback((name: ModalName) => {
    setModals((prev) => ({ ...prev, [name]: false }));
  }, []);

  const toggle = useCallback((name: ModalName) => {
    setModals((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const isOpen = useCallback((name: ModalName) => modals[name], [modals]);

  return { modals, open, close, toggle, isOpen };
};
