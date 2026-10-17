import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Info,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";

import { useHostsEditorContext } from "@renderer/context/useHostsEditorContext";
import {
  getNotificationLevel,
  notificationLimit,
  readNotificationHistory,
  saveNotificationHistory,
} from "@renderer/lib/notifications";
import type { Notification } from "@renderer/lib/notifications";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { Modal } from "./Modal";

type Action =
  | { readonly type: "add"; readonly notification: Notification }
  | { readonly type: "read"; readonly id: string }
  | { readonly type: "read-all" }
  | { readonly type: "remove"; readonly id: string }
  | { readonly type: "clear" };

const reducer = (state: Notification[], action: Action): Notification[] => {
  switch (action.type) {
    case "add": {
      const existing = state.find(
        (item) => action.notification.eventKey && item.eventKey === action.notification.eventKey,
      );
      if (existing) {
        if (
          existing.message === action.notification.message &&
          existing.level === action.notification.level
        )
          return state;
        return state.map((item) =>
          item.id === existing.id ? { ...action.notification, id: existing.id, read: false } : item,
        );
      }
      return [action.notification, ...state].slice(0, notificationLimit);
    }
    case "read":
      return state.map((item) => (item.id === action.id ? { ...item, read: true } : item));
    case "read-all":
      return state.map((item) => ({ ...item, read: true }));
    case "remove":
      return state.filter((item) => item.id !== action.id);
    case "clear":
      return [];
  }
};

const icons = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const tones = {
  success: "text-emerald-600 dark:text-emerald-400",
  info: "text-sky-600 dark:text-sky-400",
  warning: "text-orange-600 dark:text-orange-400",
  error: "text-red-600 dark:text-red-400",
};

export const NotificationCenter = () => {
  const { state, patchState } = useHostsEditorContext();
  const [notifications, dispatch] = useReducer(reducer, undefined, readNotificationHistory);
  const [open, setOpen] = useState(false);
  const previousMessage = useRef("");
  const previousUpdate = useRef("");
  const unread = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    saveNotificationHistory(notifications);
  }, [notifications]);

  useEffect(() => {
    const message = state.message.trim();
    if (previousMessage.current === message) return;
    previousMessage.current = message;
    if (!message) return;

    dispatch({
      type: "add",
      notification: {
        id: crypto.randomUUID(),
        message,
        level: getNotificationLevel(message),
        createdAt: new Date().toISOString(),
        read: false,
        source: "application",
        eventKey: "",
      },
    });
  }, [state.message]);

  useEffect(() => {
    const { status, version, message } = state.update;
    const key = `${status}:${version ?? ""}:${message ?? ""}`;
    if (previousUpdate.current === key) return;
    previousUpdate.current = key;
    if (!["available", "downloaded", "error"].includes(status)) return;

    const text =
      status === "available"
        ? `Hosts Editor ${version ?? "update"} is available. Open Settings to update.`
        : status === "downloaded"
          ? `Hosts Editor ${version ?? "update"} is ready. Open Settings to ${state.update.installSupported ? "restart and install" : "open the downloaded installer"}.`
          : (message ?? "Update failed. Open Settings to try again.");

    dispatch({
      type: "add",
      notification: {
        id: crypto.randomUUID(),
        message: text,
        level: status === "error" ? "error" : status === "downloaded" ? "success" : "info",
        createdAt: new Date().toISOString(),
        read: false,
        source: "update",
        eventKey:
          status === "error" ? `update:error:${key}` : `update:release:${version ?? "unknown"}`,
      },
    });
  }, [state.update]);

  return (
    <>
      <button
        type="button"
        aria-label={unread ? `Notifications, ${String(unread)} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
        }}
        className="ml-auto inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:text-slate-200 dark:hover:bg-amber-300/10"
      >
        <Bell size={15} className={unread ? "text-amber-600 dark:text-amber-300" : ""} />
        <span>Notifications</span>
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold tabular-nums text-slate-950"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <Modal
          title="Notifications"
          onClose={() => {
            setOpen(false);
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {unread} unread · {notifications.length} saved locally
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={unread === 0}
                icon={<CheckCheck size={14} />}
                onClick={() => {
                  dispatch({ type: "read-all" });
                }}
              >
                Mark all as read
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={notifications.length === 0}
                icon={<Trash2 size={14} />}
                onClick={() => {
                  dispatch({ type: "clear" });
                }}
              >
                Clear all
              </Button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <Bell size={28} className="text-slate-400" />
              <p className="font-medium">No notifications yet</p>
              <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
                Save results, backup messages and update notices will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((item) => {
                const Icon = icons[item.level];
                return (
                  <li
                    key={item.id}
                    className={
                      item.read
                        ? "rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.025]"
                        : "rounded-2xl border border-amber-400/40 bg-amber-50 p-3 dark:border-amber-300/25 dark:bg-amber-300/[0.055]"
                    }
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={18} className={`mt-0.5 shrink-0 ${tones[item.level]}`} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`break-words text-sm leading-5 ${item.read ? "text-slate-600 dark:text-slate-400" : "font-medium text-slate-900 dark:text-slate-100"}`}
                        >
                          {item.message}
                        </p>
                        <time
                          dateTime={item.createdAt}
                          className="mt-1 block text-xs text-slate-500 dark:text-slate-400"
                        >
                          {new Date(item.createdAt).toLocaleString()}
                        </time>
                        {item.source === "update" && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              dispatch({ type: "read", id: item.id });
                              patchState({ page: "settings" });
                              setOpen(false);
                              requestAnimationFrame(() => {
                                document
                                  .getElementById("updates")
                                  ?.scrollIntoView({ block: "start" });
                              });
                            }}
                          >
                            Open updates
                          </Button>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center">
                        {!item.read && (
                          <IconButton
                            label="Mark as read"
                            onClick={() => {
                              dispatch({ type: "read", id: item.id });
                            }}
                          >
                            <Check size={15} />
                          </IconButton>
                        )}
                        <IconButton
                          label="Remove notification"
                          onClick={() => {
                            dispatch({ type: "remove", id: item.id });
                          }}
                        >
                          <X size={15} />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            The latest {notificationLimit} notifications are kept on this device.
          </p>
        </Modal>
      )}
    </>
  );
};
