import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { CustomCheckbox } from "@shared/form/Checkbox";
import { CustomInput } from "@shared/form/Input";
import { useForm } from "react-hook-form";
import { schema } from "./schema";

import { yupResolver } from "@hookform/resolvers/yup";
import { CustomButton } from "@shared/CustomButton";
import { Check, Xmark } from "iconoir-react";
import type { HostLine } from "@utils/isHostLine";
import { defaultHostLineValue } from "@utils/defaultValues";

interface Props {
  open: boolean;
  handleSaveNewField: (data: HostLine) => void;
  handleOpen: () => void;
}

export default function AddFieldModal({
  open,
  handleSaveNewField,
  handleOpen,
}: Props) {
  const { control, handleSubmit } = useForm<HostLine>({
    defaultValues: defaultHostLineValue,
    resolver: yupResolver(schema),
  });

  return (
    <Dialog open={open} handler={handleOpen}>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();

          handleSubmit(handleSaveNewField)(ev);

          window.scrollTo({ behavior: "smooth", top: 0 });
        }}
      >
        <DialogHeader>Add new host</DialogHeader>
        <DialogBody className="flex flex-row gap-2">
          <CustomCheckbox {...{ control, name: "commented" }} />
          <CustomInput {...{ control, name: "ip", label: "IP*" }} />
          <CustomInput {...{ control, name: "domain", label: "Domain*" }} />
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
            Save
          </CustomButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
