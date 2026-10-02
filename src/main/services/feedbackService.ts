import { app } from "electron";
import os from "node:os";

import type {
  FeedbackCaptcha,
  FeedbackDiagnostics,
  FeedbackResult,
  FeedbackSubmission,
} from "../../shared/types";

const FEEDBACK_API = "https://www.nurbyte.dev/api/feedback";

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Feedback service returned ${String(response.status)}`);
  }
  return (await response.json()) as T;
};

export class FeedbackService {
  async captcha(): Promise<FeedbackCaptcha> {
    const response = await fetch(`${FEEDBACK_API}/captcha`, {
      headers: { Accept: "application/json" },
    });
    return readJson<FeedbackCaptcha>(response);
  }

  async submit(payload: FeedbackSubmission): Promise<FeedbackResult> {
    const diagnostics: FeedbackDiagnostics | undefined = payload.includeDiagnostics
      ? {
          appVersion: app.getVersion(),
          platform: process.platform,
          arch: process.arch,
          osVersion: os.release(),
        }
      : undefined;

    const response = await fetch(FEEDBACK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        product: "hosts-editor",
        productVersion: app.getVersion(),
        kind: payload.kind,
        email: payload.email,
        summary: payload.summary,
        description: payload.description,
        expected: payload.expected || undefined,
        reproductionSteps: payload.reproductionSteps || undefined,
        diagnostics,
        captchaToken: payload.captchaToken,
        captchaAnswer: payload.captchaAnswer,
      }),
    });
    return readJson<FeedbackResult>(response);
  }
}
