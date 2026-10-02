export type FeedbackKind = "bug" | "feature";

export interface FeedbackCaptcha {
  readonly token: string;
  readonly imageDataUrl: string;
}

export type FeedbackCaptchaResult =
  | { readonly ok: true; readonly captcha: FeedbackCaptcha }
  | { readonly ok: false; readonly message: string };

export interface FeedbackDiagnostics {
  readonly appVersion: string;
  readonly platform: string;
  readonly arch: string;
  readonly osVersion: string;
}

export interface FeedbackSubmission {
  readonly kind: FeedbackKind;
  readonly email: string;
  readonly summary: string;
  readonly description: string;
  readonly expected: string;
  readonly reproductionSteps: string;
  readonly includeDiagnostics: boolean;
  readonly captchaToken: string;
  readonly captchaAnswer: string;
}

export interface FeedbackResult {
  readonly reportId: string;
}
