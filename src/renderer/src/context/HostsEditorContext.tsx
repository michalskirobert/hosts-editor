import type { PropsWithChildren } from "react";

import { useHostsEditor } from "../hooks/useHostsEditor";
import { HostsEditorContext } from "./useHostsEditorContext";

export const HostsEditorProvider = ({ children }: PropsWithChildren) => {
  const editor = useHostsEditor();

  return <HostsEditorContext.Provider value={editor}>{children}</HostsEditorContext.Provider>;
};
