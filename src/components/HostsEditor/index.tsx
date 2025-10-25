import React, { useEffect, useRef, useState } from "react";
import { isHostLine, type HostLine } from "@utils/isHostLine";
import { CustomCheckbox } from "@shared/form/Checkbox";
import { CustomInput } from "@shared/form/Input";
import { useFieldArray, useForm } from "react-hook-form";
import { CustomTextarea } from "@shared/form/Textarea";
import { ButtonsContainer } from "./ButtonsContainer";
import AddFieldModal from "./AddFieldFormModal";
import { Trash } from "iconoir-react";
import { CustomButton } from "@shared/CustomButton";
import type { HostsArgs } from "./types";

export const HostsEditor: React.FC = () => {
  const { control, handleSubmit, reset } = useForm<HostsArgs>({
    defaultValues: { lines: [], text: "" },
  });

  const { fields, append, remove } = useFieldArray({ name: "lines", control });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

  const lastInputRef = useRef<HTMLInputElement | null>(null);
  const [focusId, setFocusId] = useState<string>("");

  const toggleEditingMode = () => setIsEditMode((prev) => !prev);
  const toggleAddingMode = () => setIsAddingMode((prev) => !prev);
  const toggleFieldModal = () => setIsFieldModalOpen((prev) => !prev);

  const loadHosts = async () => {
    if (!window.electronAPI) {
      console.warn(
        "Electron API undefined – uruchamiasz w przeglądarce, a nie w Electron?"
      );
      return;
    }

    try {
      const rawLinesArray = await window.electronAPI.readHosts();
      const rawLinesString = await window.electronAPI.readHostsRaw();

      const processedLines = rawLinesArray.map((line, idx) => ({
        id: idx,
        line: line.replace("#", ""),
        commented: line.trim().startsWith("#"),
        isHost: isHostLine(line),
      }));

      reset({ lines: processedLines, text: rawLinesString });
    } catch (err) {
      console.error("Błąd wczytywania hosts:", err);
    }
  };

  const handleSave = async ({
    text,
    lines,
  }: {
    text: string;
    lines: HostLine[];
  }) => {
    if (!window.electronAPI) return;

    setIsLoading(true);
    let toSave: string[];

    try {
      if (isEditMode) {
        toSave = text.split(/\r?\n/);
      } else {
        toSave = lines.map((l) =>
          l.commented
            ? `#${l.line.replace(/^#/, "")}`
            : l.line.replace(/^#/, "")
        );
      }

      await window.electronAPI.writeHosts(toSave);
      await loadHosts();

      alert("Zapisano hosts!");
    } catch (err) {
      alert("Błąd zapisu: " + err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewField = (data: HostLine) => {
    append(data);
    setFocusId(`host-${fields.length + 1}`);
    toggleFieldModal();
  };

  const onBack = () => {
    setIsEditMode(false);
    setIsAddingMode(false);
  };

  useEffect(() => {
    loadHosts();
  }, []);

  useEffect(() => {
    if (focusId) {
      lastInputRef.current?.focus();
      setFocusId("");
    }
  }, [fields, focusId]);

  return (
    <section className="max-w-screen dark:bg-black">
      <form onSubmit={handleSubmit(handleSave)}>
        <div className="flex items-center justify-between border-b border-stroke sm:px-6 xl:px-7.5 p-3">
          <h2 className="font-medium text-dark dark:border-dark-3 dark:text-white flex-shrink-0">
            Hosts Editor 0.0.2
          </h2>
          <ButtonsContainer
            {...{
              isAddingMode,
              isEditMode,
              isSaving: isLoading,
              toggleAddingMode,
              toggleEditingMode,
              loadHosts,
              onBack,
              toggleFieldModal,
            }}
          />
        </div>
        <div className="flex flex-col shadow-lg p-10 overflow-y-scroll h-[93vh] rounded-[10px] bg-white dark:bg-black shadow-1 dark:bg-gray-dark dark:shadow-card">
          {isEditMode ? (
            <CustomTextarea
              {...{
                control,
                name: "text",
                rows: 30,
                resize: true,
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
                    {...{ control, name: `lines.${idx}.commented` }}
                  />
                  <CustomInput
                    {...{
                      control,
                      name: `lines.${idx}.line`,
                    }}
                  />
                  <CustomButton
                    className="h-[35px] w-[35px] flex flex-col items-center justify-center"
                    variant="gradient"
                    color="red"
                    size="sm"
                    icon={<Trash />}
                    onClick={() => remove(idx)}
                  />
                </div>
              ) : (
                <div key={l.id} className="text-gray-400 italic">
                  {l.line}
                </div>
              )
            )
          )}
        </div>
        <AddFieldModal
          {...{
            open: isFieldModalOpen,
            handleOpen: toggleFieldModal,
            handleSaveNewField,
          }}
        />
      </form>
    </section>
  );
};
