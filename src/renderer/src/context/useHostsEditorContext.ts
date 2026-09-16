import type { useHostsEditor } from "@renderer/hooks/useHostsEditor";
import { createContext, useContext } from "react";

type HostsEditorContextValue = ReturnType<typeof useHostsEditor>;

export const HostsEditorContext = createContext<HostsEditorContextValue | undefined>(undefined);

export const useHostsEditorContext = (): HostsEditorContextValue => {
  const context = useContext(HostsEditorContext);

  if (!context) {
    throw new Error("useHostsEditorContext must be used inside HostsEditorProvider.");
  }

  return context;
};
