import type { LoadersArgs } from "@namespaces/hosts";
import type { CustomButtonProps } from "@shared/CustomButton";
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

export const getHeaderButtons = ({
  isEditMode,
  isDirty,
  loading,
  toggle,
  onBack,
  toggleEditingMode,
  loadHosts,
}: Params): CustomButtonProps[] => [
  {
    key: "add",
    children: "Add new host",
    icon: <Plus />,
    color: "green",
    variant: "gradient",
    onClick: () => toggle("add"),
    disabled: loading.saving || loading.searching,
    hidden: isEditMode,
    tooltip: "Add a new host entry",
  },
  {
    key: "save",
    children: "Save",
    icon: <FloppyDisk />,
    color: "green",
    variant: "gradient",
    type: "submit",
    tooltip: !isDirty ? "No changes to save" : "Save changes",
    loading: loading.saving,
    disabled: !isDirty || loading.searching,
  },
  {
    key: "edit",
    children: "Edit as text",
    icon: <EditPencil />,
    color: "yellow",
    variant: "gradient",
    onClick: toggleEditingMode,
    disabled: loading.saving || loading.searching,
    hidden: isEditMode,
    tooltip: "Edit hosts as raw text",
  },
  {
    key: "reset",
    children: "Reset",
    icon: <Refresh />,
    color: "blue",
    variant: "gradient",
    onClick: loadHosts,
    disabled: loading.saving || loading.searching,
    tooltip: "Reload original hosts file",
  },
  {
    key: "back",
    children: "Back",
    icon: <ArrowRight />,
    color: "black",
    variant: "gradient",
    onClick: onBack,
    disabled: loading.saving || loading.searching,
    hidden: !isEditMode,
    tooltip: "Go back to previous view",
  },
];
