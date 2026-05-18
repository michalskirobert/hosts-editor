import { version } from "../../../package.json";
import { SearchBar } from "@components/searchBar";
import { HeaderButtons } from "@components/layout/HeaderButtons";
import type { LoadersArgs } from "@typings/hosts";
import { processVersion } from "@utils/processVersion";
import type { Settings } from "@electron/types/settings";
import { getLogoPath } from "./utils";

interface Props {
  isEditMode: boolean;
  isDirty: boolean;
  loading: LoadersArgs;
  settings: Settings;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  toggle: (name: "add" | "settings") => void;
  onBack: () => void;
  toggleEditingMode: () => void;
  loadHosts: () => Promise<void>;
}

export const Header = ({
  isEditMode,
  isDirty,
  loading,
  settings,
  onSearchChange,
  toggle,
  onBack,
  toggleEditingMode,
  loadHosts,
}: Props) => {
  return (
    <nav
      className="
        flex items-center justify-between
        p-3 sm:px-6 xl:px-7.5
        border-b border-zinc-200 dark:border-zinc-800
        bg-white dark:bg-zinc-950
        text-zinc-900 dark:text-zinc-100
      "
    >
      <div className="flex items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={getLogoPath(settings.appearance)}
            alt="NurByte"
            height={42}
            width={42}
            className="rounded-lg shadow-sm"
          />
          <span
            className="
              text-sm font-medium
              text-zinc-700 dark:text-zinc-200
              tracking-wide flex gap-1
            "
          >
            <span>Hosts editor</span>
            <b className="text-zinc-900 dark:text-white">
              {processVersion(version)}
            </b>
          </span>
        </div>
      </div>
      <div className="flex-1 flex justify-center px-4">
        <div className="w-full max-w-md">
          <SearchBar {...{ onSearchChange }} />
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <HeaderButtons
          {...{
            isEditMode,
            loading,
            isDirty,
            toggle,
            onBack,
            toggleEditingMode,
            loadHosts,
          }}
        />
      </div>
    </nav>
  );
};
