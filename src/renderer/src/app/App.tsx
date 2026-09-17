import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { AppDialog } from "../components/ui/AppDialog";
import { HostsEditorProvider } from "../context/HostsEditorContext";
import { BackupsPage } from "../features/backups/BackupsPage";
import { EditorPage } from "../features/editor/EditorPage";
import { SettingsPage } from "../features/settings/SettingsPage";

const AppContent = () => {
  const { state } = useHostsEditorContext();

  return (
    <div className="flex h-screen bg-[#f5f7fb] text-slate-800 dark:bg-[#090d14] dark:text-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="scroll h-[calc(100vh-76px)] overflow-auto px-5">
          {state.page === "editor" && <EditorPage />}
          {state.page === "backups" && <BackupsPage />}
          {state.page === "settings" && <SettingsPage />}
        </div>
      </main>
      <AppDialog />
    </div>
  );
};

export const App = () => (
  <HostsEditorProvider>
    <AppContent />
  </HostsEditorProvider>
);
