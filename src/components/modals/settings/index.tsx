import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@material-tailwind/react";
import { CustomButton } from "@shared/CustomButton";
import { Check, Settings, Xmark } from "iconoir-react";
import { useForm } from "react-hook-form";

interface Props {
  open: boolean;
  handleOpen: () => void;
}

export const SettingsModal = ({ open, handleOpen }: Props) => {
  const { control, handleSubmit } = useForm();

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
        <DialogBody className="flex flex-row gap-2">HEllo world</DialogBody>
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
