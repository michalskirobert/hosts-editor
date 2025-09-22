export {};

declare global {
  interface Window {
    electronAPI: {
      readHosts: () => Promise<string[]>;
      readHostsRaw: () => Promise<string>;
      writeHosts: (lines: string[]) => Promise<boolean>;
    };
  }
}
