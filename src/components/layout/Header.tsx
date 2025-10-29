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
  isLoading: boolean;
  isDirty: boolean;
  toggle: (name: "add" | "settings") => void;
  onBack: () => void;
  toggleEditingMode: () => void;
  loadHosts: () => Promise<void>;
}

export const Header = ({
  isEditMode,
  isLoading,
  isDirty,
  toggle,
  onBack,
  toggleEditingMode,
  loadHosts,
}: Props) => {
  return (
    <nav className="flex items-center justify-between border-b border-stroke sm:px-6 xl:px-7.5 p-3">
      <div className="flex-shrink-0 flex gap-2 items-center">
        <img src="./logo.png" alt="NurByte" height={100} width={100} />
        <h2 className="font-medium text-dark dark:border-dark-3">
          Hosts Editor {version}
        </h2>
      </div>

      <div className="flex gap-2 w-screen justify-end">
        <CustomButton
          onClick={() => toggle("add")}
          variant="gradient"
          color="green"
          icon={<Plus />}
          disabled={isLoading}
          hidden={isEditMode}
          tooltip="Add a new host entry"
        >
          Add new host
        </CustomButton>
        <CustomButton
          variant="gradient"
          color="green"
          type="submit"
          tooltip={!isDirty ? "No changes to save" : "Save changes"}
          icon={<FloppyDisk />}
          loading={isLoading}
          disabled={!isDirty}
        >
          Save
        </CustomButton>
        <CustomButton
          onClick={toggleEditingMode}
          color="yellow"
          variant="gradient"
          icon={<EditPencil />}
          disabled={isLoading}
          hidden={isEditMode}
          tooltip="Edit hosts as raw text"
        >
          Edit as text
        </CustomButton>
        <CustomButton
          variant="gradient"
          color="blue"
          icon={<Refresh />}
          disabled={isLoading}
          onClick={loadHosts}
          tooltip="Reload original hosts file"
        >
          Reset
        </CustomButton>
        <CustomButton
          onClick={onBack}
          variant="gradient"
          color="black"
          icon={<ArrowRight />}
          disabled={isLoading}
          hidden={!isEditMode}
          tooltip="Go back to previous view"
        >
          Back
        </CustomButton>
      </div>
    </nav>
  );
};
