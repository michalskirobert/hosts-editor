import { Menu, MenuItemConstructorOptions, BrowserWindow, app } from "electron";

export function registerMenu(mainWindow: BrowserWindow) {
  const isMac = process.platform === "darwin";

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.getName(),
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              {
                label: "Check for updates",
                click: () => {
                  mainWindow.webContents.send("check-for-updates");
                },
              },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),

    {
      label: "File",
      submenu: [
        ...(isMac ? [] : [{ role: "quit" as const }]),
        { type: "separator" as const },
        {
          label: "Save",
          click: () => {
            mainWindow.webContents.send("trigger-save");
          },
        },
      ] as MenuItemConstructorOptions[],
    },

    {
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
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
