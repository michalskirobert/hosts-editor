import { CustomButton } from "@shared/CustomButton";

import {
  Plus,
  Refresh,
  EditPencil,
  FloppyDisk,
  ArrowRight,
} from "iconoir-react";

interface Props {
  isEditMode: boolean;
  isAddingMode: boolean;
  isSaving: boolean;
  toggleFieldModal?: () => void;
  onBack: () => void;
  toggleEditingMode: () => void;
  loadHosts: () => Promise<void>;
}

export const ButtonsContainer = ({
  isAddingMode,
  isEditMode,
  isSaving,
  toggleFieldModal,
  onBack,
  toggleEditingMode,
  loadHosts,
}: Props) => {
  const showBackButton = isAddingMode || isEditMode;

  return (
    <div className="flex gap-2 sticky top-0 w-screen justify-end p-5">
      <CustomButton
        onClick={toggleFieldModal}
        variant="gradient"
        color="green"
        icon={<Plus />}
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
        hidden={isAddingMode}
      >
        Save
      </CustomButton>
      <CustomButton
        onClick={toggleEditingMode}
        color="yellow"
        variant="gradient"
        icon={<EditPencil />}
        hidden={isAddingMode || isEditMode}
      >
        Edit as text
      </CustomButton>
      <CustomButton
        variant="gradient"
        color="blue"
        icon={<Refresh />}
        onClick={loadHosts}
      >
        Reset
      </CustomButton>
      <CustomButton
        onClick={onBack}
        variant="gradient"
        color="black"
        icon={<ArrowRight />}
        hidden={!showBackButton}
      >
        Back
      </CustomButton>
    </div>
  );
};
