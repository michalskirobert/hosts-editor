/// <reference types="vite/client" />
import type { HostsEditorApi } from "../../preload";
declare global {
  interface Window {
    readonly hostsEditor: HostsEditorApi;
  }
}
export {};
