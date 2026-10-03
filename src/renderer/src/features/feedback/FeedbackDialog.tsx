import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Checkbox, Input, Textarea } from "@renderer/components/shared/form";
import { Button } from "@renderer/components/ui/Button";
import { Modal } from "@renderer/components/ui/Modal";
import { cn } from "@renderer/lib/cn";
import type { FeedbackCaptcha, FeedbackKind } from "@shared/types";

interface FeedbackDialogProps {
  readonly version: string;
  readonly initialKind: FeedbackKind;
  readonly onClose: () => void;
}

interface FeedbackFormValues {
  kind: FeedbackKind;
  email: string;
  summary: string;
  description: string;
  expected: string;
  steps: string;
  includeDiagnostics: boolean;
  captchaAnswer: string;
}

interface FieldProps {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly children: React.ReactNode;
}

const Field = ({ label, hint, error, children }: FieldProps) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
    {children}
    {error ? (
      <span className="block text-xs text-red-600 dark:text-red-300">{error}</span>
    ) : hint ? (
      <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
    ) : null}
  </label>
);

export const FeedbackDialog = ({ version, initialKind, onClose }: FeedbackDialogProps) => {
  const [captcha, setCaptcha] = useState<FeedbackCaptcha | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [reportId, setReportId] = useState("");
  const initialCaptchaRequested = useRef(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    resetField,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormValues>({
    mode: "onTouched",
    defaultValues: {
      kind: initialKind,
      email: "",
      summary: "",
      description: "",
      expected: "",
      steps: "",
      includeDiagnostics: true,
      captchaAnswer: "",
    },
  });

  const kind = watch("kind");
  const email = watch("email");

  const loadCaptcha = useCallback(async (): Promise<void> => {
    setLoadingCaptcha(true);
    setCaptchaError("");
    try {
      const result = await window.hostsEditor.getFeedbackCaptcha();
      if (!result.ok) {
        setCaptcha(null);
        setCaptchaError(result.message);
        return;
      }
      setCaptcha(result.captcha);
      resetField("captchaAnswer", { defaultValue: "" });
    } catch (cause) {
      setCaptcha(null);
      setCaptchaError(
        cause instanceof Error ? cause.message : "Could not load CAPTCHA. Try again.",
      );
    } finally {
      setLoadingCaptcha(false);
    }
  }, [resetField]);

  useEffect(() => {
    if (initialCaptchaRequested.current) return;
    initialCaptchaRequested.current = true;
    void loadCaptcha();
  }, [loadCaptcha]);

  const submit = handleSubmit(async (values): Promise<void> => {
    if (!captcha) {
      setRequestError("CAPTCHA is unavailable. Refresh it and try again.");
      return;
    }

    setRequestError("");
    try {
      const result = await window.hostsEditor.submitFeedback({
        kind: values.kind,
        email: values.email.trim(),
        summary: values.summary.trim(),
        description: values.description.trim(),
        expected: values.expected.trim(),
        reproductionSteps: values.kind === "bug" ? values.steps.trim() : "",
        includeDiagnostics: values.includeDiagnostics,
        captchaToken: captcha.token,
        captchaAnswer: values.captchaAnswer.trim(),
      });
      if (!result.ok) {
        if (/captcha/i.test(result.message)) {
          setError("captchaAnswer", { type: "server", message: result.message });
          await loadCaptcha();
          return;
        }
        setRequestError(result.message);
        return;
      }
      setReportId(result.result.reportId);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The report could not be sent.";
      if (/captcha/i.test(message)) setError("captchaAnswer", { type: "server", message });
      else setRequestError(message);
      await loadCaptcha();
    }
  });

  if (reportId) {
    return (
      <Modal title="Feedback sent" onClose={onClose}>
        <div className="flex flex-col items-center px-2 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
            <CheckCircle2 size={30} className="text-emerald-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Thanks for helping improve Hosts Editor.</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            We sent a confirmation to {email}. Report ID:{" "}
            <span className="font-mono text-slate-700 dark:text-slate-200">{reportId}</span>.
          </p>
          <Button className="mt-6" variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  const footer = (
    <div className="flex w-full items-center justify-between gap-4">
      <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
        Required fields are marked automatically when validation fails.
      </p>
      <div className="ml-auto flex gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          icon={<Send size={16} />}
          disabled={isSubmitting || loadingCaptcha || !captcha}
          disabledReason={
            isSubmitting
              ? "Your report is being sent"
              : loadingCaptcha
                ? "Security check is loading"
                : !captcha
                  ? "Security check is unavailable"
                  : undefined
          }
          onClick={() => {
            void submit();
          }}
        >
          {isSubmitting ? "Sending…" : "Send feedback"}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      title={kind === "bug" ? "Report a bug" : "Suggest a feature"}
      onClose={onClose}
      wide
      footer={footer}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        noValidate
      >
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Feedback type">
              {(
                [
                  {
                    id: "bug",
                    label: "Bug report",
                    caption: "Something is not working",
                    icon: Bug,
                  },
                  {
                    id: "feature",
                    label: "Feature request",
                    caption: "Suggest an improvement",
                    icon: Lightbulb,
                  },
                ] as const
              ).map(({ id, label, caption, icon: Icon }) => {
                const active = field.value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      field.onChange(id);
                    }}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                      active
                        ? "border-amber-400/45 bg-amber-400/[0.09] shadow-[0_12px_30px_-24px_rgba(245,158,11,0.75)] dark:border-amber-300/20"
                        : "border-slate-300/55 bg-white/35 hover:border-amber-400/30 hover:bg-amber-400/[0.045] dark:border-white/[0.065] dark:bg-white/[0.025]",
                    )}
                  >
                    <Icon size={18} className={active ? "text-amber-500" : "text-slate-500"} />
                    <div className="mt-1 font-semibold">{label}</div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {caption}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label="Your email"
            hint="Used only for confirmation and replies."
            {...(errors.email?.message ? { error: errors.email.message } : {})}
          >
            <Input
              type="email"
              placeholder="you@example.com"
              autoFocus
              invalid={Boolean(errors.email)}
              {...register("email", {
                required: "Enter your email address",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
            />
          </Field>
          <Field
            label="Short description"
            {...(errors.summary?.message ? { error: errors.summary.message } : {})}
          >
            <Input
              placeholder="A short summary"
              invalid={Boolean(errors.summary)}
              {...register("summary", {
                required: "Add a short description",
                maxLength: { value: 140, message: "Keep the summary under 140 characters" },
              })}
            />
          </Field>
        </div>

        <Field
          label={kind === "bug" ? "What happened?" : "Your suggestion"}
          {...(errors.description?.message ? { error: errors.description.message } : {})}
        >
          <Textarea
            rows={3}
            placeholder={
              kind === "bug" ? "Describe the problem" : "Describe the feature or improvement"
            }
            invalid={Boolean(errors.description)}
            {...register("description", {
              required: kind === "bug" ? "Describe what happened" : "Describe your suggestion",
              minLength: { value: 10, message: "Use at least 10 characters" },
              maxLength: { value: 5000, message: "Keep the description under 5000 characters" },
            })}
          />
        </Field>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label={kind === "bug" ? "What did you expect?" : "Why would it help?"}>
            <Textarea rows={2} {...register("expected")} />
          </Field>
          {kind === "bug" ? (
            <Field label="Steps to reproduce">
              <Textarea rows={2} placeholder={"1. …\n2. …\n3. …"} {...register("steps")} />
            </Field>
          ) : (
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="font-medium text-slate-800 dark:text-slate-200">Feature request</div>
              <p className="mt-1">
                Tell us what problem the feature would solve. That context helps us evaluate the
                idea.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.045] p-4 dark:bg-emerald-400/[0.035]">
            <div className="flex gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Privacy-first diagnostics
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Hosts contents, hostnames, IP addresses, backups and personal files are never
                  included automatically.
                </p>
                <Controller
                  control={control}
                  name="includeDiagnostics"
                  render={({ field }) => (
                    <Checkbox
                      className="mt-2"
                      checked={field.value}
                      label={`Include Hosts Editor ${version} and system information`}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-300/55 bg-white/35 p-4 dark:border-white/[0.065] dark:bg-white/[0.025]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Security check
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the characters shown below.
                </div>
              </div>
              <Button
                size="sm"
                icon={
                  <RefreshCw size={14} className={loadingCaptcha ? "animate-spin" : undefined} />
                }
                disabled={loadingCaptcha}
                disabledReason={loadingCaptcha ? "CAPTCHA is already refreshing" : undefined}
                onClick={() => {
                  void loadCaptcha();
                }}
              >
                {captchaError ? "Retry" : "Refresh"}
              </Button>
            </div>
            <div className="grid min-h-14 grid-cols-[160px_1fr] items-center gap-3">
              <div className="flex h-14 items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-slate-950/95 dark:border-white/10">
                {loadingCaptcha ? (
                  <div
                    className="flex items-center gap-2 text-xs text-slate-300"
                    role="status"
                    aria-label="Loading CAPTCHA"
                  >
                    <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" />
                    <span>Loading…</span>
                  </div>
                ) : captcha ? (
                  <img
                    src={captcha.imageDataUrl}
                    alt="CAPTCHA challenge"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex items-center gap-1.5 px-2 text-center text-xs text-red-300">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Unavailable</span>
                  </div>
                )}
              </div>
              <div>
                <Input
                  disabled={loadingCaptcha || !captcha}
                  placeholder={loadingCaptcha ? "Loading security check…" : "CAPTCHA"}
                  autoComplete="off"
                  spellCheck={false}
                  invalid={Boolean(errors.captchaAnswer)}
                  {...register("captchaAnswer", { required: "Complete the security check" })}
                />
                {errors.captchaAnswer?.message ? (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-300">
                    {errors.captchaAnswer.message}
                  </div>
                ) : captchaError ? (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-300">{captchaError}</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {requestError && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-300"
          >
            {requestError}
          </div>
        )}
      </form>
    </Modal>
  );
};
