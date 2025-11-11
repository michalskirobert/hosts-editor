import React from "react";
import { useHosts } from "./hooks/use-hosts";
import { Header } from "@components/layout/Header";
import { HostsList } from "@components/hosts";
import AddFieldModal from "@components/modals/addField";
import { SettingsModal } from "@components/modals/settings";
import UpdateChecker from "@components/modals/update";

export const App: React.FC = () => {
  const {
    control,
    fields,
    isEditMode,
    loading,
    lastInputRef,
    modals,
    isDirty,
    filter,
    onSearchChange,
    handleSubmit,
    handleSave,
    handleSaveNewField,
    loadHosts,
    onBack,
    remove,
    toggle,
    toggleEditingMode,
  } = useHosts();

  return (
    <section className="max-w-screen">
      <form onSubmit={handleSubmit(handleSave)}>
        <Header
          {...{
            isEditMode,
            isDirty,
            loading,
            loadHosts,
            onBack,
            toggleEditingMode,
            toggle,
            onSearchChange,
          }}
        />
        <HostsList
          {...{
            isEditMode,
            loading,
            fields,
            control,
            lastInputRef,
            highlight: filter,
            remove,
            filter,
          }}
        />
        {modals.add && (
          <AddFieldModal
            {...{
              open: modals.add,
              handleOpen: () => toggle("add"),
              handleSaveNewField,
            }}
          />
        )}
      </form>
      {modals.settings && (
        <SettingsModal
          {...{ open: modals.settings, handleOpen: () => toggle("settings") }}
        />
      )}
      <UpdateChecker />
    </section>
  );
};
