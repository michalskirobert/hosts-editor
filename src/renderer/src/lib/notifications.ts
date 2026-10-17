import { z } from "zod";

const storageKey = "hosts-editor.notifications.v1";
export const notificationLimit = 100;

const notificationSchema = z.object({
  id: z.uuid(),
  message: z.string(),
  level: z.enum(["success", "info", "warning", "error"]),
  createdAt: z.iso.datetime(),
  read: z.boolean(),
  source: z.enum(["application", "update"]),
  eventKey: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const getNotificationLevel = (message: string): Notification["level"] => {
  if (/failed|error|could not|invalid|unavailable|refusing|unrecognized/i.test(message))
    return "error";
  if (/unsaved|hidden|pending|warning/i.test(message)) return "warning";
  if (/up to date|saved|created|imported|exported|restored/i.test(message)) return "success";
  return "info";
};

export const readNotificationHistory = (): Notification[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    const result = z.array(notificationSchema).max(notificationLimit).safeParse(value);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
};

export const saveNotificationHistory = (notifications: readonly Notification[]): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  } catch {
    return;
  }
};
