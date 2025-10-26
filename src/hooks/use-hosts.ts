import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useModalManager } from "@utils/modalsManager";
import { processLines, processLinesToSave } from "@helpers/process-lines";

import type { HostsArgs } from "@namespaces/hosts";
import type { HostLine } from "@utils/isHostLine";

export const useHosts = () => {
  const { control, handleSubmit, reset } = useForm<HostsArgs>({
    defaultValues: { lines: [], text: "" },
  });

  const { fields, append, remove } = useFieldArray({ name: "lines", control });
  const { modals, toggle } = useModalManager("add", "login", "register");

  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusId, setFocusId] = useState<string>("");

  const lastInputRef = useRef<HTMLInputElement | null>(null);

  const toggleEditingMode = () => setIsEditMode((prev) => !prev);

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

      const processedLines = processLines(rawLinesArray);

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
        toSave = processLinesToSave(lines);
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
    toggle("add");
  };

  const onBack = () => {
    setIsEditMode(false);
    toggle("add");
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

  return {
    control,
    fields,
    isEditMode,
    isLoading,
    focusId,
    modals,
    lastInputRef,
    handleSubmit,
    toggle,
    handleSave,
    handleSaveNewField,
    onBack,
    toggleEditingMode,
    remove,
    loadHosts,
  };
};
