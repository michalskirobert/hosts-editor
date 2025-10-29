import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@material-tailwind/react";
import { CustomButton } from "@shared/CustomButton";
import { Check, Settings, Xmark } from "iconoir-react";
import { useForm } from "react-hook-form";
import { defaultSettings } from "./utils";
import { CustomCheckbox } from "@shared/form/Checkbox";
import type { Settings as SettingsArgs } from "@namespaces/settings";
import { toast } from "react-toastify";
import { useEffect, useMemo } from "react";

interface Props {
  open: boolean;
  handleOpen: () => void;
}

export const SettingsModal = ({ open, handleOpen }: Props) => {
  const { control, reset, handleSubmit } = useForm<SettingsArgs>({
    defaultValues: defaultSettings,
  });

  const onSave = (data: SettingsArgs) => {
    console.log("EXEC");
    localStorage.setItem("appData", JSON.stringify({ settings: data }));
    toast.success("Your data has been saved");
    handleOpen();
  };

  const clearUserData = () => {
    localStorage.removeItem("user");
    toast.success("User password has been deleted from the application.");
  };

  const hasUserData = useMemo(() => !!localStorage.getItem("user"), []);

  useEffect(() => {
    const data = localStorage.getItem("appData.settings");
    console.log(data);

    if (!data) return;

    reset(JSON.parse(data));
  }, []);

  return (
    <Dialog open={open} handler={handleOpen}>
      <form onSubmit={handleSubmit(onSave)}>
        <DialogHeader className="flex gap-2 items-center">
          <Settings />
          Settings
        </DialogHeader>
        <DialogBody>
          <div>
            <h2>General settings</h2>
            <div className="flex flex-col gap-2">
              <CustomCheckbox
                {...{
                  control,
                  name: "keepUserPassword",
                  label: "Remember user's data (Password, login)",
                }}
              />
              <CustomButton
                color="red"
                variant="filled"
                disabled={!hasUserData}
                tooltip={
                  !hasUserData
                    ? "There is no saved user data"
                    : "Your data will be permamently removed"
                }
                onClick={clearUserData}
              >
                Clear your data
              </CustomButton>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <CustomButton
            variant="text"
            color="red"
            onClick={handleOpen}
            className="mr-1"
            icon={<Xmark />}
          >
            Cancel
          </CustomButton>
          <CustomButton
            type="submit"
            variant="filled"
            color="green"
            icon={<Check />}
          >
            Save changes
          </CustomButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
