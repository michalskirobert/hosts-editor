import { Bug, Lightbulb, Mail, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Checkbox, Input, Textarea } from "@renderer/components/shared/form";
import { Button } from "@renderer/components/ui/Button";
import { Modal } from "@renderer/components/ui/Modal";
import { cn } from "@renderer/lib/cn";

type FeedbackKind = "bug" | "feature";

interface FeedbackDialogProps {
  readonly version: string;
  readonly initialKind: FeedbackKind;
  readonly onClose: () => void;
}

const recipient = "rm.software.lab@gmail.com";

export const FeedbackDialog = ({ version, initialKind, onClose }: FeedbackDialogProps) => {
  const [kind, setKind] = useState<FeedbackKind>(initialKind);
  const [summary, setSummary] = useState("");
  const [happened, setHappened] = useState("");
  const [expected, setExpected] = useState("");
  const [steps, setSteps] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const diagnostics = useMemo(
    () =>
      `Hosts Editor ${version}\nPlatform: ${navigator.platform}\nUser agent: ${navigator.userAgent}`,
    [version],
  );
  const missingRequired = !summary.trim() || (kind === "bug" && !happened.trim());

  const openEmail = async (): Promise<void> => {
    if (missingRequired) return;
    const subject = `${kind === "bug" ? "#BUG" : "#FEATURE"} ${summary.trim()}`;
    const sections =
      kind === "bug"
        ? [
            `What happened?\n${happened.trim()}`,
            `What did you expect?\n${expected.trim() || "—"}`,
            `Steps to reproduce\n${steps.trim() || "—"}`,
          ]
        : [
            `Suggestion\n${happened.trim() || "—"}`,
            `Why would it help?\n${expected.trim() || "—"}`,
          ];
    if (includeDiagnostics) sections.push(`Diagnostics\n${diagnostics}`);
    sections.push(
      "\nPrivacy note: Hosts Editor did not attach hosts, hostnames, IP addresses, backups or personal files.",
    );

    const url = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(sections.join("\n\n"))}`;
    await window.hostsEditor.openExternal(url);
    onClose();
  };

  return (
    <Modal title={kind === "bug" ? "Report a bug" : "Suggest a feature"} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { id: "bug", label: "Bug report", icon: Bug },
              { id: "feature", label: "Feature request", icon: Lightbulb },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = kind === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={cn(
                  "group rounded-2xl border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                  active
                    ? "-translate-y-0.5 border-amber-400/45 bg-amber-50/75 shadow-[0_14px_34px_-24px_rgba(245,158,11,0.58)] dark:border-amber-300/[0.18] dark:bg-amber-300/[0.075]"
                    : "border-slate-300/55 bg-white/35 hover:-translate-y-0.5 hover:border-amber-400/45 hover:bg-amber-50/75 dark:border-white/[0.065] dark:bg-white/[0.025] dark:hover:border-amber-300/[0.18] dark:hover:bg-amber-300/[0.075]",
                )}
              >
                <Icon
                  size={18}
                  className={active ? "text-amber-600 dark:text-amber-300" : "text-slate-500"}
                />
                <div className="mt-2 font-medium">{label}</div>
              </button>
            );
          })}
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Short description</span>
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="A short summary"
            autoFocus
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            {kind === "bug" ? "What happened?" : "Your suggestion"}
          </span>
          <Textarea
            rows={4}
            value={happened}
            onChange={(event) => setHappened(event.target.value)}
            placeholder={
              kind === "bug" ? "Describe the problem" : "Describe the feature or improvement"
            }
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            {kind === "bug" ? "What did you expect?" : "Why would it help?"}
          </span>
          <Textarea
            rows={3}
            value={expected}
            onChange={(event) => setExpected(event.target.value)}
          />
        </label>

        {kind === "bug" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Steps to reproduce</span>
            <Textarea
              rows={3}
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              placeholder="1. …\n2. …\n3. …"
            />
          </label>
        )}

        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.045] p-4 dark:bg-emerald-400/[0.035]">
          <div className="flex gap-3">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Privacy-first diagnostics</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Hosts contents, hostnames, IP addresses, backups and personal files are never
                included automatically.
              </p>
              <Checkbox
                className="mt-3"
                checked={includeDiagnostics}
                label="Include app version and system information"
                onChange={setIncludeDiagnostics}
              />
              {includeDiagnostics && (
                <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{diagnostics}</pre>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-4 dark:border-white/[0.06]">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon={<Mail size={16} />}
            disabled={missingRequired}
            disabledReason={
              !summary.trim() ? "Add a short description first" : "Describe what happened first"
            }
            onClick={() => {
              void openEmail();
            }}
          >
            Open email
          </Button>
        </div>
      </div>
    </Modal>
  );
};
