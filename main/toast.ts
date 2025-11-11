import { mainWindow } from "./windows";

interface Props {
  type: "info" | "warning" | "success" | "error";
  message: string;
}

export const toast = ({ message, type }: Props) => {
  if (!mainWindow) {
    return;
  }

  mainWindow.webContents.send("toast", {
    type,
    message,
  });
};
