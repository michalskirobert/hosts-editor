import React from "react";
import { CustomTextarea } from "@shared/form/Textarea";
import { HostLine } from "@components/hosts/HostLine";
import type { Control, FieldArrayWithId } from "react-hook-form";
import type { HostsArgs, LoadersArgs } from "@namespaces/hosts";
import { CustomLoadingBlocker } from "@shared/LoadingBlocker";

interface HostsListProps {
  isEditMode: boolean;
  loading: LoadersArgs;
  fields: FieldArrayWithId<HostsArgs, "lines", "id">[];
  control: Control<HostsArgs>;
  lastInputRef: React.MutableRefObject<HTMLInputElement | null>;
  filter: string;
  remove: (idx: number) => void;
}

export const HostsList: React.FC<HostsListProps> = ({
  isEditMode,
  loading,
  fields,
  control,
  lastInputRef,
  filter,
  remove,
}) => {
  const isLoading = loading.saving || loading.searching;

  return (
    <CustomLoadingBlocker {...{ isLoading }}>
      <div className="flex flex-col shadow-lg p-10 overflow-y-scroll h-[93vh] rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        {isEditMode ? (
          <CustomTextarea
            {...{
              control,
              name: "text",
              rows: 30,
              resize: true,
              disabled: isLoading,
            }}
          />
        ) : (
          fields
            .filter((l) => `${l.ip} ${l.domain}`.includes(filter))
            .map((l, idx) => (
              <HostLine
                key={l.id}
                idx={idx}
                id={l.id}
                control={control}
                isHost={l.isHost}
                domain={l.domain}
                remove={remove}
                lastInputRef={lastInputRef}
              />
            ))
        )}
      </div>
    </CustomLoadingBlocker>
  );
};
