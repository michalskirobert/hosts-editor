import { version } from "../../../package.json";
import { SearchBar } from "@components/searchBar";
import { HeaderButtons } from "@components/layout/HeaderButtons";
import type { LoadersArgs } from "@typings/hosts";
import { processVersion } from "@utils/processVersion";

interface Props {
  isEditMode: boolean;
  isDirty: boolean;
  loading: LoadersArgs;
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
  onSearchChange,
  toggle,
  onBack,
  toggleEditingMode,
  loadHosts,
}: Props) => {
  return (
    <nav className="flex items-center border-b border-stroke sm:px-6 xl:px-7.5 p-3 justify-between">
      <div className="flex items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="./header_logo.jpg"
            alt="NurByte"
            height={45}
            width={45}
            className="m-0 p-0"
          />
          <span className="font-medium text-dark opacity-60 dark:border-dark-3">
            Hosts editor <b>{processVersion(version)}</b>
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
