import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { StatusBar } from "../components/layout/StatusBar";
import { AppDialog } from "../components/ui/AppDialog";
import { ScrollArea } from "../components/ui/ScrollArea";
import { Toast } from "../components/ui/Toast";
import { HostsEditorProvider } from "../context/HostsEditorContext";
import { BackupsPage } from "../features/backups/BackupsPage";
import { EditorPage } from "../features/editor/EditorPage";
import { SettingsPage } from "../features/settings/SettingsPage";

const AppContent = () => {
  const { state } = useHostsEditorContext();

  return (
    <div className="relative flex h-screen min-w-[1000px] overflow-hidden bg-[#f3f1eb] font-sans text-slate-900 dark:bg-[#05080e] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-44 h-[560px] w-[560px] rounded-full bg-amber-200/24 blur-[120px] dark:bg-amber-400/14" />
        <div className="absolute -right-36 top-[3%] h-[620px] w-[620px] rounded-full bg-sky-200/14 blur-[145px] dark:bg-indigo-500/[0.08]" />
        <div className="absolute bottom-[-300px] left-[26%] h-[700px] w-[700px] rounded-full bg-yellow-100/18 blur-[155px] dark:bg-yellow-300/[0.055]" />
        <div className="absolute left-[20%] top-[12%] h-[420px] w-[720px] -rotate-12 rounded-[100%] border border-amber-300/20 bg-gradient-to-r from-transparent via-amber-200/10 to-transparent blur-2xl dark:border-amber-300/[0.07] dark:via-amber-300/[0.035]" />
        <div className="absolute inset-0 opacity-24 [background-image:radial-gradient(circle_at_center,rgba(71,85,105,0.18)_0_1px,transparent_1.2px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)] dark:opacity-20 dark:[background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.18)_0_1px,transparent_1.2px)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.08)_68%,rgba(226,224,218,0.24)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.08)_58%,rgba(2,6,23,0.64)_100%)]" />
      </div>

      <Sidebar />
      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Header />
        <ScrollArea className="min-h-0 flex-1 px-5">
          {state.page === "editor" && <EditorPage />}
          {state.page === "backups" && <BackupsPage />}
          {state.page === "settings" && <SettingsPage />}
        </ScrollArea>
        <StatusBar />
      </main>
      <AppDialog />
      <Toast />
    </div>
  );
};

export const App = () => (
  <HostsEditorProvider>
    <AppContent />
  </HostsEditorProvider>
);
