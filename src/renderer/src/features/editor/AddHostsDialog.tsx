import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { isValidHostname, isValidIpAddress } from "../../../../shared/domain/hosts";
import type { HostLine } from "../../../../shared/types";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { Modal } from "../../components/ui/Modal";
import { Input, Toggle } from "../../components/shared/form";

interface AddHostsDialogProps {
  readonly tabName: string;
  readonly existingLines: readonly HostLine[];
  readonly onClose: () => void;
  readonly onAdd: (lines: readonly HostLine[], saveNow: boolean) => Promise<void>;
}

interface HostDraft {
  readonly id: string;
  readonly enabled: boolean;
  readonly address: string;
  readonly hostname: string;
  readonly comment: string;
}

const createDraft = (): HostDraft => ({
  id: crypto.randomUUID(),
  enabled: true,
  address: "127.0.0.1",
  hostname: "",
  comment: "",
});

export const AddHostsDialog = ({ tabName, existingLines, onClose, onAdd }: AddHostsDialogProps) => {
  const [drafts, setDrafts] = useState<readonly HostDraft[]>([createDraft()]);
  const [submitting, setSubmitting] = useState(false);

  const patchDraft = (id: string, value: Partial<HostDraft>): void => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...value } : draft)),
    );
  };

  const errors = useMemo(
    () =>
      drafts.map((draft) => ({
        address: !isValidIpAddress(draft.address),
        hostname: !isValidHostname(draft.hostname),
      })),
    [drafts],
  );
  const duplicateIds = useMemo(() => {
    const existing = new Set(
      existingLines
        .filter((line) => line.kind === "host")
        .map(
          (line) => `${line.address.trim().toLowerCase()}|${line.hostname.trim().toLowerCase()}`,
        ),
    );
    const seen = new Set<string>();
    return new Set(
      drafts
        .filter((draft) => {
          const key = `${draft.address.trim().toLowerCase()}|${draft.hostname.trim().toLowerCase()}`;
          if (!draft.hostname.trim()) return false;
          const duplicate = existing.has(key) || seen.has(key);
          seen.add(key);
          return duplicate;
        })
        .map((draft) => draft.id),
    );
  }, [drafts, existingLines]);

  const hasErrors =
    errors.some((error) => error.address || error.hostname) || duplicateIds.size > 0;

  const submit = async (saveNow: boolean): Promise<void> => {
    if (hasErrors || submitting) return;
    setSubmitting(true);
    try {
      const lines: readonly HostLine[] = drafts.map((draft) => ({
        id: crypto.randomUUID(),
        kind: "host",
        enabled: draft.enabled,
        address: draft.address.trim(),
        hostname: draft.hostname.trim(),
        comment: draft.comment.trim(),
        raw: "",
      }));
      await onAdd(lines, saveNow);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add hosts" onClose={onClose} wide>
      <p className="mb-5 text-sm text-slate-500">
        Add one or multiple entries to <strong>“{tabName}”</strong>. Add hosts keeps them as unsaved
        changes; Add & Save also updates the system hosts file.
      </p>

      <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className="grid grid-cols-[44px_150px_minmax(180px,1fr)_minmax(140px,1fr)_36px] items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-white/10"
          >
            <Toggle
              checked={draft.enabled}
              label={draft.enabled ? "Disable host" : "Enable host"}
              className="mt-1"
              onChange={(enabled) => {
                patchDraft(draft.id, { enabled });
              }}
            />

            <div>
              <Input
                autoFocus={index === 0}
                value={draft.address}
                onChange={(event) => {
                  patchDraft(draft.id, { address: event.target.value });
                }}
                placeholder="127.0.0.1"
                invalid={Boolean(errors[index]?.address)}
                monospace
              />
              {errors[index]?.address && (
                <div className="mt-1 text-[11px] text-red-500">Invalid IP address</div>
              )}
            </div>

            <div>
              <Input
                value={draft.hostname}
                onChange={(event) => {
                  patchDraft(draft.id, { hostname: event.target.value });
                }}
                placeholder="dev.example.com"
                invalid={Boolean(errors[index]?.hostname) || duplicateIds.has(draft.id)}
                monospace
              />
              {errors[index]?.hostname && (
                <div className="mt-1 text-[11px] text-red-500">Invalid hostname</div>
              )}
              {!errors[index]?.hostname && duplicateIds.has(draft.id) && (
                <div className="mt-1 text-[11px] text-red-500">
                  This IP and hostname combination already exists
                </div>
              )}
            </div>

            <Input
              value={draft.comment}
              onChange={(event) => {
                patchDraft(draft.id, { comment: event.target.value });
              }}
              placeholder="Comment"
            />

            <IconButton
              label="Remove row"
              danger
              disabled={drafts.length === 1}
              disabledReason={drafts.length === 1 ? "At least one host row is required" : undefined}
              className="mt-1"
              onClick={() => {
                setDrafts((current) => current.filter((item) => item.id !== draft.id));
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
      </div>

      <Button
        className="mt-3"
        icon={<Plus size={15} />}
        onClick={() => {
          setDrafts((current) => [...current, createDraft()]);
        }}
      >
        Add another host
      </Button>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
        <span className="text-xs text-slate-400">
          {drafts.length} {drafts.length === 1 ? "host" : "hosts"} will be added
        </span>
        <div className="flex gap-2">
          <Button
            onClick={onClose}
            disabled={submitting}
            disabledReason={submitting ? "Wait until hosts are added" : undefined}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            disabled={hasErrors || submitting}
            disabledReason={
              submitting
                ? "Adding hosts…"
                : hasErrors
                  ? "Fix validation errors before adding hosts"
                  : undefined
            }
            onClick={() => {
              void submit(false);
            }}
          >
            Add hosts
          </Button>
          <Button
            variant="primary"
            disabled={hasErrors || submitting}
            disabledReason={
              submitting
                ? "Adding and saving hosts…"
                : hasErrors
                  ? "Fix validation errors before saving"
                  : undefined
            }
            onClick={() => {
              void submit(true);
            }}
          >
            Add & Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
