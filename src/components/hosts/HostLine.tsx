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
  lastInputRef?: ForwardedRef<HTMLDivElement>;
  remove: (idx: number) => void;
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
        />
        <CustomInput
          {...{
            control,
            name: `lines.${idx}.domain`,
          }}
        />
      </div>
      <button
        className="
          relative ml-2 flex h-10 w-10 items-center justify-center
          rounded-xl border border-red-200/40
          bg-red-500/90 text-white
          shadow-sm shadow-red-500/20
          transition-all duration-200
          hover:-translate-y-[1px]
          hover:bg-red-500
          hover:shadow-md hover:shadow-red-500/25
          active:translate-y-0
          focus:outline-none
          focus-visible:ring-2 focus-visible:ring-red-400/30
        "
        onClick={() => remove(idx)}
      >
        <Trash className="h-4 w-4" />
      </button>
    </div>
  );
};
