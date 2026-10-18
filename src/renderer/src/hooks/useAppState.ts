import { useCallback, useLayoutEffect, useReducer, useRef } from "react";

import type {
  AppSettings,
  BackupInfo,
  EditorMode,
  HostTab,
  UpdateState,
} from "../../../shared/types";
import type { DialogState } from "../types/dialog";
import type { Page } from "../types/navigation";

export interface AppState {
  readonly tabs: readonly HostTab[];
  readonly saved: Readonly<Record<string, string>>;
  readonly savedTabs: Readonly<Record<string, HostTab>>;
  readonly selected: string;
  readonly mode: EditorMode;
  readonly raw: string;
  readonly query: string;
  readonly page: Page;
  readonly settings: AppSettings;
  readonly backups: readonly BackupInfo[];
  readonly hostsPath: string;
  readonly version: string;
  readonly update: UpdateState;
  readonly busy: boolean;
  readonly message: string;
  readonly renamingId: string | undefined;
  readonly renameValue: string;
  readonly dialog: DialogState;
}

type Action =
  | { readonly type: "patch"; readonly value: Partial<AppState> }
  | { readonly type: "set-tabs"; readonly tabs: readonly HostTab[] }
  | { readonly type: "patch-tab"; readonly tab: HostTab }
  | { readonly type: "append-tab"; readonly tab: HostTab };

const initialState: AppState = {
  tabs: [],
  saved: {},
  savedTabs: {},
  selected: "",
  mode: "structured",
  raw: "",
  query: "",
  page: "editor",
  settings: {
    theme: "system",
    fullscreen: false,
    checkForUpdates: true,
    autoBackupOnSave: true,
  },
  backups: [],
  hostsPath: "",
  version: "",
  update: { status: "idle" },
  busy: false,
  message: "",
  renamingId: undefined,
  renameValue: "",
  dialog: { kind: "none" },
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "patch": {
      const incoming = action.value.update;
      if (incoming && (incoming.revision ?? 0) < (state.update.revision ?? 0))
        return { ...state, ...action.value, update: state.update };
      return { ...state, ...action.value };
    }
    case "set-tabs":
      return { ...state, tabs: action.tabs };
    case "patch-tab":
      return {
        ...state,
        tabs: state.tabs.map((tab) => (tab.id === action.tab.id ? action.tab : tab)),
      };
    case "append-tab":
      return { ...state, tabs: [...state.tabs, action.tab] };
  }
};

export const useAppState = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mounted = useRef(true);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const patchState = useCallback((value: Partial<AppState>): void => {
    if (mounted.current) dispatch({ type: "patch", value });
  }, []);
  const setTabs = useCallback((tabs: readonly HostTab[]): void => {
    if (mounted.current) dispatch({ type: "set-tabs", tabs });
  }, []);
  const patchTab = useCallback((tab: HostTab): void => {
    if (mounted.current) dispatch({ type: "patch-tab", tab });
  }, []);
  const appendTab = useCallback((tab: HostTab): void => {
    if (mounted.current) dispatch({ type: "append-tab", tab });
  }, []);

  return { state, patchState, setTabs, patchTab, appendTab };
};
