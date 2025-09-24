import React, { useEffect, useState } from "react";
import { isHostLine, type HostLine } from "../utils/isHostLine";
import { Checkbox } from "./shared/form/Checkbox";
import { Input } from "./shared/form/Input";
import { useFieldArray, useForm } from "react-hook-form";
import { Textarea } from "./shared/form/Textarea";
import { ButtonsContainer } from "./ButtonsContainer";
import { Button } from "./shared/Button";
import { DeleteIcon } from "../utils/Icons";

export const HostsEditor: React.FC = () => {
  const { control, handleSubmit, reset } = useForm<{
    lines: HostLine[];
    text: string;
  }>();

  const { fields, remove } = useFieldArray({ name: "lines", control });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleEditingMode = () => setIsEditMode((prev) => !prev);
  const toggleAddingMode = () => setIsAddingMode((prev) => !prev);

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
        commented: !line.trim().startsWith("#"),
        isHost: isHostLine(line),
      }));

      reset({ lines: processedLines, text: rawLinesString });
    } catch (err) {
      console.error("Błąd wczytywania hosts:", err);
    }
  };

  useEffect(() => {
    loadHosts();
  }, []);

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

  const onBack = () => {
    setIsEditMode(false);
    setIsAddingMode(false);
  };

  return (
    <section className="w-[100vw]">
      <form onSubmit={handleSubmit(handleSave)}>
        <ButtonsContainer
          {...{
            isAddingMode,
            isEditMode,
            isSaving: isLoading,
            toggleAddingMode,
            toggleEditingMode,
            loadHosts,
            onBack,
          }}
        />
        <h2 className="border-b border-stroke px-4 py-4 font-medium text-dark dark:border-dark-3 dark:text-white sm:px-6 xl:px-7.5">
          Hosts Editor 0.0.1
        </h2>
        <div className="flex flex-col shadow-lg p-10 overflow-y-scroll rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          {isEditMode ? (
            <Textarea
              {...{ control, name: "text", className: "h-[100vh] w-full" }}
            />
          ) : (
            fields.map((l, idx) =>
              l.isHost ? (
                <div key={l.id} className="flex flex-row items-center gap-2">
                  <Checkbox {...{ control, name: `lines.${idx}.commented` }} />
                  <Input {...{ control, name: `lines.${idx}.line` }} />
                  <Button
                    {...{
                      icon: DeleteIcon,
                      label: "",
                      className: "h-[35px] w-[35px]",
                      variant: "danger",
                      size: "small",
                      onClick: () => remove(idx),
                    }}
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
      </form>
    </section>
  );
};
