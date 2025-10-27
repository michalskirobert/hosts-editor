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

interface Props {
  open: boolean;
  handleOpen: () => void;
}

export const SettingsModal = ({ open, handleOpen }: Props) => {
  const { control, handleSubmit } = useForm({ defaultValues: defaultSettings });

  const onSave = () => {};

  return (
    <Dialog open={open} handler={handleOpen}>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();

          handleSubmit(onSave)(ev);

          window.scrollTo({ behavior: "smooth", top: 0 });
        }}
      >
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
                  name: "rememberCurrentUser",
                  label: "Remember user's data (Password, login)",
                }}
              />
              <CustomButton
                color="red"
                variant="filled"
                onClick={() => alert("REMOVED")}
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
