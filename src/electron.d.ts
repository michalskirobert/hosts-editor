import type { UpdateEventArgs } from "@components/modals/update/types";
import type { Settings } from "@electron/settings.types";

export {};

declare global {
  interface Window {
    electronAPI: {
      readHosts: () => Promise<string[]>;
      readHostsRaw: () => Promise<string>;
      writeHosts: (lines: string[]) => Promise<boolean>;
      setPassword: (pw: string) => Promise<boolean>;
      readSettings: () => Promise<Settings>;
      updateSettings: (settings: Settings) => Promise<boolean>;
      onUpdateStatus: (
        callback: (ev: Event, args: UpdateEventArgs) => void,
      ) => void;
      onTriggerSave: (callback: () => void) => void;
      toggleSettingsModal: (callback: () => void) => void;
      removeToggleSettingsModalListener: (callback: () => void) => void;
      removeTriggerSaveListener: (callback: () => void) => void;
      onToast: (
        callback: (payload: {
          type: "success" | "error" | "info";
          message: string;
        }) => void,
      ) => void;
      removeToastListener: (callback: (...args: any[]) => void) => void;
    };
  }
}
