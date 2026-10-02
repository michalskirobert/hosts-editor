import { z } from "zod";

export const feedbackFormSchema = z.object({
  email: z.email("Enter a valid email address").trim().min(1, "Email is required"),
  summary: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters")
    .max(120, "Keep the summary under 120 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Describe the report in at least 10 characters")
    .max(4000, "Keep the description under 4000 characters"),
  expected: z.string().trim().max(2000, "Keep this field under 2000 characters"),
  steps: z.string().trim().max(2500, "Keep the reproduction steps under 2500 characters"),
  captchaAnswer: z.string().trim().min(1, "Complete the CAPTCHA"),
});

export type FeedbackFormErrors = Partial<Record<keyof z.infer<typeof feedbackFormSchema>, string>>;
