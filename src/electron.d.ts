import type { UpdateEventArgs } from "@components/modals/update/types";

export {};

declare global {
  interface Window {
    electronAPI: {
      readHosts: () => Promise<string[]>;
      readHostsRaw: () => Promise<string>;
      writeHosts: (lines: string[]) => Promise<boolean>;
      setPassword: (pw: string) => Promise<boolean>;
      onUpdateStatus: (
        callback: (ev: Event, args: UpdateEventArgs) => void
      ) => void;
      onTriggerSave: (callback: () => void) => void;
      removeTriggerSaveListener: (callback: () => void) => void;
      onToast: (
        callback: (payload: {
          type: "success" | "error" | "info";
          message: string;
        }) => void
      ) => void;
      removeToastListener: (callback: (...args: any[]) => void) => void;
      onOpenSettings: (callback: () => void) => void;
      removeOpenSettingsListener: (callback: () => void) => void;
      removeUpdateStatusListener: (
        callback: (ev: Event, args: UpdateEventArgs) => void
      ) => void;
      onUpdateProgress: (callback: (progress: number) => void) => void;
      removeUpdateProgressListener: (
        callback: (progress: number) => void
      ) => void;
    };
  }
}
