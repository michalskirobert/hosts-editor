import { Menu, MenuItemConstructorOptions, BrowserWindow, app } from "electron";
import { about, checkForUpdates, quit, separator } from "./utils";

export function registerMenu(mainWindow: BrowserWindow) {
  const template: MenuItemConstructorOptions[] = [];

  template.push({
    label: app.getName() || "App",
    submenu: [about, separator, checkForUpdates, separator, quit],
  });

  template.push({
    label: "File",
    submenu: [
      {
        label: "Save",
        click: () => {
          mainWindow.webContents.send("trigger-save");
        },
      },
      separator,
      quit,
    ],
  });

  template.push({
    label: "Edit",
    submenu: [
      { role: "undo" as const },
      { role: "redo" as const },
      { type: "separator" as const },
      { role: "cut" as const },
      { role: "copy" as const },
      { role: "paste" as const },
      { role: "selectAll" as const },
    ],
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
