import { z } from "zod";

export const hostLineSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["host", "comment", "blank", "raw"]),
  enabled: z.boolean(),
  address: z.string(),
  hostname: z.string(),
  comment: z.string(),
  raw: z.string(),
});

export const hostTabSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  enabled: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  lines: z.array(hostLineSchema),
});

export const settingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  fullscreen: z.boolean(),
  checkForUpdates: z.boolean(),
  autoBackupOnSave: z.boolean(),
});
export const backupReasonSchema = z.enum([
  "auto-save",
  "manual",
  "pre-restore",
  "pre-import",
  "pre-delete",
]);
export const backupInfoSchema = z.object({
  tabId: z.string(),
  fileName: z.string(),
  createdAt: z.string(),
  path: z.string(),
  reason: backupReasonSchema,
});
export const feedbackSubmissionSchema = z.object({
  kind: z.enum(["bug", "feature"]),
  email: z.email().max(254),
  summary: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  expected: z.string().max(2000),
  reproductionSteps: z.string().max(2500),
  includeDiagnostics: z.boolean(),
  captchaToken: z.string().min(1).max(4096),
  captchaAnswer: z.string().trim().min(1).max(256),
});
