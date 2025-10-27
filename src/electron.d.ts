export {};

declare global {
  interface Window {
    electronAPI: {
      readHosts: () => Promise<string[]>;
      readHostsRaw: () => Promise<string>;
      writeHosts: (lines: string[]) => Promise<boolean>;
      setPassword: (pw: string) => Promise<boolean>;
      onTriggerSave: (callback: () => void) => void;
      removeTriggerSaveListener: (callback: () => void) => void;
      onToast: (
        callback: (payload: {
          type: "success" | "error" | "info";
          message: string;
        }) => void
      ) => void;
      removeToastListener: (callback: (...args: any[]) => void) => void;
    };
  }
}
