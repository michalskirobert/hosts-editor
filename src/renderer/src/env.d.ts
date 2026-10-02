/// <reference types="vite/client" />
import type { HostsEditorApi } from "../../shared/hostsEditorApi";
declare global {
  interface Window {
    readonly hostsEditor: HostsEditorApi;
  }
}
export {};
