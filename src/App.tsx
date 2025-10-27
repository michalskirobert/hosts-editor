import React from "react";
import { CustomCheckbox } from "@shared/form/Checkbox";
import { CustomInput } from "@shared/form/Input";
import { CustomTextarea } from "@shared/form/Textarea";
import { Trash } from "iconoir-react";
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
            isLoading,
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
                  className="flex flex-row items-center gap-3"
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
                  <div className="flex flex-1 gap-2">
                    <CustomInput
                      {...{
                        control,
                        name: `lines.${idx}.ip`,
                        disabled: isLoading,
                      }}
                      style={{ flex: "0 0 30%" }}
                    />
                    <CustomInput
                      {...{
                        control,
                        name: `lines.${idx}.domain`,
                        disabled: isLoading,
                      }}
                      style={{ flex: "0 0 70%" }}
                    />
                  </div>
                  <button
                    className="flex items-center justify-center ml-2 bg-red-500 p-2 rounded-lg text-white hover:bg-red-400 transition-colors duration-500"
                    onClick={() => remove(idx)}
                  >
                    <Trash />
                  </button>
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
