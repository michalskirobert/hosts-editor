import React, { useEffect, useState } from "react";
import { isHostLine, type HostLine } from "../utils/isHostLine";
import { Button } from "./shared/Button";
import { AddIcon, EditIcon, SaveIcon } from "../utils/Icons";
import { defaultHostLineValue } from "../utils/defaultValues";
import { Checkbox } from "./shared/form/Checkbox";
import { Input } from "./shared/form/Input";
import { useFieldArray, useForm } from "react-hook-form";
import { Textarea } from "./shared/form/Textarea";

export const HostsEditor: React.FC = () => {
  const { control, handleSubmit, reset } = useForm<{
    lines: HostLine[];
    text: string;
  }>();

  const { fields } = useFieldArray({ name: "lines", control });

  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleEditingMode = () => setIsEditingMode((prev) => !prev);
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
        line,
        commented: line.trim().startsWith("#"),
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

  const handleSave = async ({ lines }: { lines: HostLine[] }) => {
    if (!window.electronAPI) return;

    setIsLoading(true);

    const toSave = lines.map((l) =>
      l.commented
        ? l.line.startsWith("#")
          ? l.line
          : "#" + l.line
        : l.line.replace(/^#/, "")
    );

    try {
      await window.electronAPI.writeHosts(toSave);
      await loadHosts();

      alert("Zapisano hosts!");
    } catch (err) {
      alert("Błąd zapisu: " + err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-[100vw]">
      <form onSubmit={handleSubmit(handleSave)}>
        <div className="flex gap-2 sticky top-0 w-[100vw] justify-end p-5">
          <Button
            label="Add new host"
            onClick={toggleAddingMode}
            icon={<AddIcon />}
            variant="dark"
            hidden={isEditingMode}
          />
          <Button
            label="Save"
            icon={<SaveIcon />}
            variant="green"
            type="submit"
          />
          <Button
            label="Edit content"
            icon={<EditIcon />}
            onClick={toggleEditingMode}
            variant="primary"
            hidden={isAddingMode}
          />
        </div>
        <h2 className="border-b border-stroke px-4 py-4 font-medium text-dark dark:border-dark-3 dark:text-white sm:px-6 xl:px-7.5">
          Hosts Editor 0.0.1
        </h2>
        <div className="flex flex-col shadow-lg p-10 overflow-y-scroll rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          {isEditingMode ? (
            <Textarea
              {...{ control, name: "text", className: "h-[100vh] w-full" }}
            />
          ) : (
            fields.map((l, idx) =>
              l.isHost ? (
                <div key={l.id} className="flex flex-row items-center gap-2">
                  <Checkbox {...{ control, name: `lines.${idx}.commented` }} />
                  <Input {...{ control, name: `lines.${idx}.line` }} />
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
