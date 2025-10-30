import { CustomButton } from "@shared/CustomButton";

import { version } from "../../../package.json";
import { SearchBar } from "@components/searchBar";
import { getHeaderButtons } from "@utils/headerButtons";
import type { LoadersArgs } from "@namespaces/hosts";

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
      <div className="flex items-center gap-2 flex-shrink-0">
        <img src="./logo.png" alt="NurByte" height={100} width={100} />
        <h2 className="font-medium text-dark dark:border-dark-3">
          Hosts Editor {version}
        </h2>
      </div>
      <div className="flex-1 flex justify-center px-4">
        <div className="w-full max-w-md">
          <SearchBar {...{ onSearchChange }} />
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {getHeaderButtons({
          isEditMode,
          loading,
          isDirty,
          toggle,
          onBack,
          toggleEditingMode,
          loadHosts,
        }).map(({ key, children, ...restProps }) => (
          <CustomButton key={key} {...restProps}>
            {children}
          </CustomButton>
        ))}
      </div>
    </nav>
  );
};
