import { CustomButton } from "@shared/CustomButton";

import {
  Plus,
  Refresh,
  EditPencil,
  FloppyDisk,
  ArrowRight,
} from "iconoir-react";

import { version } from "../../../package.json";

interface Props {
  isEditMode: boolean;
  modals: Record<"register" | "add" | "login", boolean>;
  isSaving: boolean;
  toggle: (name: "register" | "add" | "login") => void;
  onBack: () => void;
  toggleEditingMode: () => void;
  loadHosts: () => Promise<void>;
}

export const Header = ({
  modals,
  isEditMode,
  isSaving,
  toggle,
  onBack,
  toggleEditingMode,
  loadHosts,
}: Props) => {
  const showBackButton = modals.add || isEditMode;

  return (
    <nav className="flex items-center justify-between border-b border-stroke sm:px-6 xl:px-7.5 p-3">
      <h2 className="font-medium text-dark dark:border-dark-3 flex-shrink-0">
        Hosts Editor {version}
      </h2>
      <div className="flex gap-2 w-screen justify-end">
        <CustomButton
          onClick={() => toggle("add")}
          variant="gradient"
          color="green"
          icon={<Plus />}
          disabled={isSaving}
          hidden={isEditMode}
        >
          Add new host
        </CustomButton>
        <CustomButton
          variant="gradient"
          color="green"
          type="submit"
          icon={<FloppyDisk />}
          loading={isSaving}
          hidden={modals.add}
        >
          Save
        </CustomButton>
        <CustomButton
          onClick={toggleEditingMode}
          color="yellow"
          variant="gradient"
          icon={<EditPencil />}
          disabled={isSaving}
          hidden={modals.add || isEditMode}
        >
          Edit as text
        </CustomButton>
        <CustomButton
          variant="gradient"
          color="blue"
          icon={<Refresh />}
          disabled={isSaving}
          onClick={loadHosts}
        >
          Reset
        </CustomButton>
        <CustomButton
          onClick={onBack}
          variant="gradient"
          color="black"
          icon={<ArrowRight />}
          disabled={isSaving}
          hidden={!showBackButton}
        >
          Back
        </CustomButton>
      </div>
    </nav>
  );
};
