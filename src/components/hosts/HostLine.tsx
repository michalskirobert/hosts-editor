import React from "react";
import type { ForwardedRef } from "react";
import { CustomCheckbox } from "@shared/form/Checkbox";
import { CustomInput } from "@shared/form/Input";
import { Hashtag, Trash } from "iconoir-react";

interface HostLineProps {
  idx: number;
  id: string;
  control: any;
  isHost: boolean;
  domain: string;
  remove: (idx: number) => void;
  lastInputRef?: ForwardedRef<HTMLDivElement>;
}

export const HostLine: React.FC<HostLineProps> = ({
  idx,
  id,
  control,
  isHost,
  domain,
  remove,
  lastInputRef,
}) => {
  if (!isHost)
    return (
      <div key={id} className="text-gray-400 italic">
        {domain}
      </div>
    );

  return (
    <div
      key={id}
      className="flex flex-row items-center gap-3"
      id={`host-${id}`}
      ref={lastInputRef}
      tabIndex={0}
    >
      <CustomCheckbox
        {...{
          control,
          name: `lines.${idx}.commented`,
          icon: <Hashtag className="h-4 w-4" />,
        }}
      />
      <div className="flex flex-1 gap-2">
        <CustomInput
          {...{
            control,
            name: `lines.${idx}.ip`,
          }}
          style={{ flex: "0 0 30%" }}
        />
        <CustomInput
          {...{
            control,
            name: `lines.${idx}.domain`,
          }}
          style={{ flex: "0 0 70%" }}
        />
      </div>
      <button
        className="flex items-center justify-center ml-2 bg-red-500 p-2 rounded-lg text-white hover:bg-red-400 transition-colors duration-500"
        onClick={() => remove(idx)}
      >
        <Trash />
      </button>
    </div>
  );
};
