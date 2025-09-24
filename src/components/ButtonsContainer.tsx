import {
  AddIcon,
  BackIcon,
  EditIcon,
  RefreshIcon,
  SaveIcon,
} from "../utils/Icons";
import { Button } from "./shared/Button";

interface Props {
  isEditMode: boolean;
  isAddingMode: boolean;
  isSaving: boolean;
  onBack: () => void;
  toggleAddingMode: () => void;
  toggleEditingMode: () => void;
  loadHosts: () => Promise<void>;
}

export const ButtonsContainer = ({
  isAddingMode,
  isEditMode,
  isSaving,
  onBack,
  toggleAddingMode,
  toggleEditingMode,
  loadHosts,
}: Props) => {
  const showBackButton = isAddingMode || isEditMode;

  return (
    <div className="flex gap-2 sticky top-0 w-[100vw] justify-end p-5">
      <Button
        label="Add new host"
        onClick={toggleAddingMode}
        icon={AddIcon}
        variant="primary"
        hidden={isEditMode}
      />
      <Button
        label="Save"
        icon={SaveIcon}
        variant="green"
        type="submit"
        isLoading={isSaving}
        hidden={isAddingMode}
      />
      <Button
        label="Edit content"
        icon={EditIcon}
        onClick={toggleEditingMode}
        variant="warning"
        hidden={isAddingMode || isEditMode}
      />
      <Button
        label="Reset"
        icon={RefreshIcon}
        variant="info"
        onClick={loadHosts}
      />
      <Button
        label="Back"
        icon={BackIcon}
        onClick={onBack}
        variant="dark"
        hidden={!showBackButton}
      />
    </div>
  );
};
