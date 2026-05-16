import { Modal } from "@shared/Modal";

import { CustomButton } from "@shared/button";
import { Check, Xmark } from "iconoir-react";
import { useForm } from "react-hook-form";
import { defaultSettings } from "./utils";
import type { Settings } from "@electron/types/settings";
import { toast } from "react-toastify";
import { useCallback, useEffect, useState } from "react";
import { CustomSelect } from "@shared/form/Select";
import { CustomCheckbox } from "@shared/form/Checkbox";
import { applyTheme } from "@utils/applyTheme";
import { CustomLoadingBlocker } from "@shared/LoadingBlocker";

interface Props {
  open: boolean;
  setSettings: (settings: Settings) => void;
  handleOpen: () => void;
}

export const SettingsModal = ({ open, setSettings, handleOpen }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const { control, reset, handleSubmit } = useForm<Settings>({
    defaultValues: defaultSettings,
  });

  const onSave = useCallback(async (data: Settings) => {
    try {
      setIsLoading(true);
      const res = await window.electronAPI.updateSettings(data);

      if (!res) return;

      await window.electronAPI.toggleFullscreen(data.appearance.fullscreen);

      toast.success("Your settings has been saved");
      applyTheme(data.appearance.mode);
      setSettings(data);
      handleOpen();
    } catch (error) {
      toast.error("Settings cannot be saved!");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const data = await window.electronAPI.readSettings();
      reset(data);
    };

    load();
  }, [reset]);
  return (
    <CustomLoadingBlocker isLoading={isLoading}>
      <form onSubmit={handleSubmit(onSave)}>
        <Modal
          {...{
            title: "Settings",
            isOpen: open,
            onClose: handleOpen,
            size: "md",
            footer: (
              <>
                <CustomButton
                  color="danger"
                  onClick={handleOpen}
                  className="mr-1"
                  icon={<Xmark />}
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  color="success"
                  icon={<Check />}
                  loading={isLoading}
                >
                  Save changes
                </CustomButton>
              </>
            ),
          }}
        >
          <div>
            <h2 className="text-xl font-bold">General settings</h2>
            <div className="flex flex-col gap-2">
              <div className="mt-2">
                <h3 className="mb-2 text-lg">Appearance</h3>
                <div className="flex gap-2 flex-col">
                  <CustomCheckbox
                    {...{
                      control,
                      name: "appearance.fullscreen",
                      label: "Fullscreen",
                    }}
                  />
                  <CustomSelect
                    {...{
                      control,
                      name: "appearance.mode",
                      label: "View mode",
                      options: [
                        { label: "Auto", value: "auto" },
                        { label: "Dark mode", value: "dark" },
                        { label: "Light mode", value: "light" },
                      ],
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </form>
    </CustomLoadingBlocker>
  );
};
