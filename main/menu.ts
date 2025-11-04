import {
  Menu,
  MenuItemConstructorOptions,
  BrowserWindow,
  app,
  ipcMain,
} from "electron";

export function registerMenu(mainWindow: BrowserWindow) {
  const isMac = process.platform === "darwin";

  const template: MenuItemConstructorOptions[] = [];

  if (isMac) {
    template.push({
      label: app.getName(),
      submenu: [
        { role: "about" as const },
        // {
        //   label: "Settings",
        //   accelerator: "CmdOrCtrl+,",
        //   click: () => {
        //     mainWindow.webContents.send("open-settings");
        //   },
        // },
        { type: "separator" as const },
        {
          label: "Check for updates",
          click: () => {
            ipcMain.emit("check-for-updates");
          },
        },
        { type: "separator" as const },
        { role: "quit" as const },
      ],
    });
  }

  template.push({
    label: "File",
    submenu: [
      {
        label: "Save",
        click: () => {
          mainWindow.webContents.send("trigger-save");
        },
      },
      { type: "separator" as const },
      { role: "quit" as const },
    ],
  });

  if (!isMac) {
    template.push({
      label: "Tools",
      submenu: [
        // {
        //   label: "Settings",
        //   accelerator: "Ctrl+,",
        //   click: () => {
        //     mainWindow.webContents.send("open-settings");
        //   },
        // },
        // { type: "separator" as const },
        {
          label: "Check for updates",
          click: () => {
            ipcMain.emit("check-for-updates");
          },
        },
      ],
    });
  }

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
