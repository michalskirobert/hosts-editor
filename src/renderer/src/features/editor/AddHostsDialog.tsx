import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { isValidHostname, isValidIpAddress } from "../../../../shared/domain/hosts";
import type { HostLine } from "../../../../shared/types";
import { Modal } from "../../components/ui/Modal";

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

  const hasErrors = errors.some((error) => error.address || error.hostname);

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

      <div className="scroll max-h-[52vh] space-y-2 overflow-y-auto pr-1">
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className="grid grid-cols-[44px_150px_minmax(180px,1fr)_minmax(140px,1fr)_36px] items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-white/10"
          >
            <button
              type="button"
              title={draft.enabled ? "Enabled" : "Disabled"}
              onClick={() => {
                patchDraft(draft.id, { enabled: !draft.enabled });
              }}
              className={`mt-1 h-6 w-11 rounded-full p-1 ${draft.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition ${draft.enabled ? "translate-x-5" : ""}`}
              />
            </button>

            <div>
              <input
                autoFocus={index === 0}
                value={draft.address}
                onChange={(event) => {
                  patchDraft(draft.id, { address: event.target.value });
                }}
                placeholder="127.0.0.1"
                className={`mono w-full rounded-lg border bg-transparent px-2 py-2 text-sm outline-none ${errors[index]?.address ? "border-red-400" : "border-slate-200 dark:border-white/10"}`}
              />
              {errors[index]?.address && (
                <div className="mt-1 text-[11px] text-red-500">Invalid IP address</div>
              )}
            </div>

            <div>
              <input
                value={draft.hostname}
                onChange={(event) => {
                  patchDraft(draft.id, { hostname: event.target.value });
                }}
                placeholder="dev.example.com"
                className={`mono w-full rounded-lg border bg-transparent px-2 py-2 text-sm outline-none ${errors[index]?.hostname ? "border-red-400" : "border-slate-200 dark:border-white/10"}`}
              />
              {errors[index]?.hostname && (
                <div className="mt-1 text-[11px] text-red-500">Invalid hostname</div>
              )}
              {!errors[index]?.hostname && duplicateIds.has(draft.id) && (
                <div className="mt-1 text-[11px] text-amber-500">Duplicate host entry</div>
              )}
            </div>

            <input
              value={draft.comment}
              onChange={(event) => {
                patchDraft(draft.id, { comment: event.target.value });
              }}
              placeholder="Comment"
              className="w-full rounded-lg border border-slate-200 bg-transparent px-2 py-2 text-sm outline-none dark:border-white/10"
            />

            <button
              type="button"
              title="Remove row"
              disabled={drafts.length === 1}
              onClick={() => {
                setDrafts((current) => current.filter((item) => item.id !== draft.id));
              }}
              className="mt-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-500/10"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="action mt-3"
        onClick={() => {
          setDrafts((current) => [...current, createDraft()]);
        }}
      >
        <Plus size={15} />
        Add another host
      </button>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
        <span className="text-xs text-slate-400">
          {drafts.length} {drafts.length === 1 ? "host" : "hosts"} will be added
        </span>
        <div className="flex gap-2">
          <button type="button" className="action" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:hover:bg-amber-300"
            disabled={hasErrors || submitting}
            onClick={() => {
              void submit(false);
            }}
          >
            Add hosts
          </button>
          <button
            type="button"
            className="primary"
            disabled={hasErrors || submitting}
            onClick={() => {
              void submit(true);
            }}
          >
            Add & Save
          </button>
        </div>
      </div>
    </Modal>
  );
};
