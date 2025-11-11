import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useModalManager } from "@utils/modalsManager";
import { processLines, processLinesToSave } from "@helpers/process-lines";

import type { HostsArgs } from "@namespaces/hosts";
import type { HostLine } from "@utils/isHostLine";

import { toast } from "react-toastify";
import { useLoadingStates } from "@utils/loadersManager";

export const useHosts = () => {
  const {
    control,
    formState: { isDirty },
    handleSubmit,
    reset,
  } = useForm<HostsArgs>({
    defaultValues: { lines: [], text: "" },
  });

  const { fields, append, remove } = useFieldArray({ name: "lines", control });
  const { modals, open, close, toggle } = useModalManager("add", "settings");
  const { loading, setLoadingOff, setLoadingOn } = useLoadingStates(
    "saving",
    "searching"
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [focusId, setFocusId] = useState<string>("");
  const [filter, setFilter] = useState("");

  const lastInputRef = useRef<HTMLInputElement | null>(null);

  const toggleEditingMode = () => setIsEditMode((prev) => !prev);

  const loadHosts = async () => {
    if (!window.electronAPI) {
      toast.warning(
        "Electron API is undefined – are you running this in a browser instead of Electron?"
      );
      return;
    }

    try {
      const rawLinesArray = await window.electronAPI.readHosts();
      const rawLinesString = await window.electronAPI.readHostsRaw();

      const processedLines = processLines(rawLinesArray);

      reset({ lines: processedLines, text: rawLinesString });
    } catch (err) {
      toast.error(`Error loading hosts: ${err}`);
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

    setLoadingOn("saving");
    let toSave: string[];

    try {
      if (isEditMode) {
        toSave = text.split(/\r?\n/);
      } else {
        toSave = processLinesToSave(lines);
      }

      await window.electronAPI.writeHosts(toSave);
      await loadHosts();

      toast.success("Hosts saved successfully!");
    } catch (err) {
      toast.error("Save error: " + err);
    } finally {
      setLoadingOff("saving");
    }
  };

  const onSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleSaveNewField = (data: HostLine) => {
    append(data);
    setFocusId(`host-${fields.length + 1}`);
    close("add");
  };

  const onBack = () => setIsEditMode(false);

  useEffect(() => {
    loadHosts();
  }, []);

  useEffect(() => {
    if (focusId) {
      lastInputRef.current?.focus();
      setFocusId("");
    }
  }, [fields, focusId]);

  useEffect(() => {
    const saveHandler = () => handleSubmit(handleSave)();
    window.electronAPI?.onTriggerSave(saveHandler);

    const toastHandler = (payload: {
      type: "success" | "error" | "info";
      message: string;
    }) => {
      toast[payload.type](payload.message);
    };
    window.electronAPI?.onToast(toastHandler);

    const settingsHandler = () => open("settings");
    window.electronAPI.onOpenSettings(settingsHandler);

    return () => {
      window.electronAPI?.removeTriggerSaveListener(saveHandler);
      window.electronAPI?.removeToastListener(toastHandler);
      window.electronAPI?.removeOpenSettingsListener(settingsHandler);
    };
  }, []);

  return {
    control,
    fields,
    isEditMode,
    loading,
    modals,
    lastInputRef,
    isDirty,
    filter,
    onSearchChange,
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
