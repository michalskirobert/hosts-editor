import React, { useMemo } from "react";
import { HostLine } from "@components/hosts/HostLine";
import type { Control, FieldArrayWithId } from "react-hook-form";
import type { HostsArgs, LoadersArgs } from "@namespaces/hosts";
import { CustomLoadingBlocker } from "@shared/LoadingBlocker";
import { HighlightWithinTextareaComponent } from "@shared/form/HighlitWithinTextarea";

interface HostsListProps {
  isEditMode: boolean;
  loading: LoadersArgs;
  fields: FieldArrayWithId<HostsArgs, "lines", "id">[];
  control: Control<HostsArgs>;
  lastInputRef: React.MutableRefObject<HTMLInputElement | null>;
  filter: string;
  highlight?: string;
  remove: (idx: number) => void;
}

export const HostsList: React.FC<HostsListProps> = ({
  isEditMode,
  loading,
  fields,
  control,
  lastInputRef,
  filter,
  highlight,
  remove,
}) => {
  const isLoading = loading.saving || loading.searching;

  const filteredFields = useMemo(
    () =>
      fields
        .map((item, idx) => ({ ...item, idx }))
        .filter((l) => `${l.ip} ${l.domain}`.includes(filter)),
    [fields, filter]
  );

  return (
    <CustomLoadingBlocker {...{ isLoading }}>
      <div className="flex flex-col shadow-lg p-10 overflow-y-scroll h-[93vh] rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        {isEditMode ? (
          <HighlightWithinTextareaComponent
            {...{
              control,
              name: "text",
              rows: 30,
              resize: true,
              highlight,
              disabled: isLoading,
            }}
          />
        ) : filteredFields.length ? (
          filteredFields.map((l) => (
            <HostLine
              key={l.id}
              idx={l.idx}
              id={l.id}
              control={control}
              isHost={l.isHost}
              domain={l.domain}
              remove={remove}
              lastInputRef={lastInputRef}
            />
          ))
        ) : (
          <div className="flex justify-center items-center h-full text-2xl opacity-60">
            No data
          </div>
        )}
      </div>
    </CustomLoadingBlocker>
  );
};
