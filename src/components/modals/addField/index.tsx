import { CustomCheckbox } from "@shared/form/Checkbox";
import { CustomInput } from "@shared/form/Input";
import { useForm } from "react-hook-form";
import { schema } from "./schema";

import { yupResolver } from "@hookform/resolvers/yup";
import { CustomButton } from "@shared/button";
import { Check, Hashtag, Xmark } from "iconoir-react";
import type { HostLine } from "@utils/isHostLine";
import { defaultHostLineValue } from "@utils/defaultValues";
import { Modal } from "@shared/Modal";

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
  const { control, trigger, getValues } = useForm<HostLine>({
    defaultValues: defaultHostLineValue,
    resolver: yupResolver(schema),
  });

  const onSave = async () => {
    const isValid = await trigger();

    if (!isValid) return;

    const data = getValues();

    handleSaveNewField(data);
    window.scrollTo({ behavior: "smooth", top: 0 });
  };

  return (
    <Modal
      title="Add new host"
      isOpen={open}
      onClose={handleOpen}
      footer={
        <>
          <CustomButton
            type="button"
            color="success"
            icon={<Check />}
            onClick={onSave}
          >
            Save
          </CustomButton>
          <CustomButton
            color="danger"
            onClick={handleOpen}
            className="mr-1"
            icon={<Xmark />}
          >
            Cancel
          </CustomButton>
        </>
      }
    >
      <div className="flex align-center gap-2 mb-4">
        <div className="mt-7">
          <CustomCheckbox
            {...{
              control,
              name: "commented",
              icon: <Hashtag className="h-4 w-4" />,
            }}
          />
        </div>
        <CustomInput {...{ control, name: "ip", label: "IP*" }} />
        <CustomInput {...{ control, name: "domain", label: "Domain*" }} />
      </div>
    </Modal>
  );
}
