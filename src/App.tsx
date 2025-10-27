import React from "react";
import { CustomCheckbox } from "@shared/form/Checkbox";
import { CustomInput } from "@shared/form/Input";
import { CustomTextarea } from "@shared/form/Textarea";
import { Trash } from "iconoir-react";
import { CustomButton } from "@shared/CustomButton";
import AddFieldModal from "./components/modals/AddFieldFormModal";
import { useHosts } from "./hooks/use-hosts";
import { Header } from "./components/layout/Header";

export const App: React.FC = () => {
  const {
    control,
    fields,
    isEditMode,
    isLoading,
    lastInputRef,
    modals,
    isDirty,
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
            modals,
            isEditMode,
            isSaving: isLoading,
            isDirty,
            loadHosts,
            onBack,
            toggleEditingMode,
            toggle,
          }}
        />
        <div className="flex flex-col shadow-lg p-10 overflow-y-scroll h-[93vh] rounded-[10px] bg-white  shadow-1 dark:bg-gray-dark dark:shadow-card">
          {isEditMode ? (
            <CustomTextarea
              {...{
                control,
                name: "text",
                rows: 30,
                resize: true,
                disabled: isLoading,
              }}
            />
          ) : (
            fields.map((l, idx) =>
              l.isHost ? (
                <div
                  key={l.id}
                  className="flex flex-row items-center gap-2"
                  id={`host-${l.id}`}
                  ref={lastInputRef}
                  tabIndex={0}
                >
                  <CustomCheckbox
                    {...{
                      control,
                      name: `lines.${idx}.commented`,
                      disabled: isLoading,
                    }}
                  />
                  <CustomInput
                    {...{
                      control,
                      name: `lines.${idx}.ip`,
                      disabled: isLoading,
                    }}
                  />
                  <CustomInput
                    {...{
                      control,
                      name: `lines.${idx}.domain`,
                      disabled: isLoading,
                    }}
                  />
                  <CustomButton
                    className="h-[35px] w-[35px] flex flex-col items-center justify-center"
                    variant="gradient"
                    color="red"
                    size="sm"
                    icon={<Trash />}
                    disabled={isLoading}
                    onClick={() => remove(idx)}
                  />
                </div>
              ) : (
                <div key={l.id} className="text-gray-400 italic">
                  {l.domain}
                </div>
              )
            )
          )}
        </div>
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
    </section>
  );
};
