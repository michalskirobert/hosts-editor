import type { LoadersArgs } from "@namespaces/hosts";
import { CustomButton } from "@shared/button";
import {
  Plus,
  Refresh,
  EditPencil,
  FloppyDisk,
  ArrowRight,
} from "iconoir-react";

interface Params {
  isEditMode: boolean;
  isDirty: boolean;
  loading: LoadersArgs;
  toggle: (name: "add" | "settings") => void;
  onBack: () => void;
  toggleEditingMode: () => void;
  loadHosts: () => Promise<void>;
}

export const HeaderButtons = ({
  isEditMode,
  isDirty,
  loading,
  toggle,
  onBack,
  toggleEditingMode,
  loadHosts,
}: Params) => {
  return (
    <div className="flex gap-2 items-center">
      <CustomButton
        {...{
          children: "Add new host",
          icon: <Plus />,
          color: "success",
          type: "button",
          disabled: loading.saving || loading.searching,
          hidden: isEditMode,
          tooltip: "Add a new host entry",
          onClick: () => toggle("add"),
        }}
      />
      <CustomButton
        {...{
          key: "save",
          children: "Save",
          icon: <FloppyDisk />,
          color: "primary",
          type: "submit",
          tooltip: !isDirty ? "No changes to save" : "Save changes",
          loading: loading.saving,
          disabled: !isDirty || loading.searching,
        }}
      />
      <CustomButton
        {...{
          key: "edit",
          children: "Edit as text",
          icon: <EditPencil />,
          color: "warning",
          type: "button",
          onClick: toggleEditingMode,
          disabled: loading.saving || loading.searching,
          hidden: isEditMode,
          tooltip: "Edit hosts as raw text",
        }}
      />
      <CustomButton
        {...{
          key: "reset",
          children: "Reset",
          icon: <Refresh />,
          color: "info",
          type: "button",
          onClick: loadHosts,
          disabled: loading.saving || loading.searching || !isDirty,
          tooltip: !isDirty
            ? "There is no change to reset"
            : "Reload original hosts file",
        }}
      />
      <CustomButton
        {...{
          key: "back",
          children: "Back",
          icon: <ArrowRight />,
          color: "secondary",
          onClick: onBack,
          type: "button",
          disabled: loading.saving || loading.searching,
          hidden: !isEditMode,
          tooltip: "Go back to previous view",
        }}
      />
    </div>
  );
};
