import { app, BrowserWindow, dialog, ipcMain } from "electron";
import isDev from "electron-is-dev";
import path from "node:path";

import "../main/auto-update";
import "../main/ipc";
import "../main/menu";
import "../main/tray";
import "../services/ws_integration"

import { WhatsApp } from "../services/whatsapp";
import { tabsWindow } from "../windows/tabs-window";
import { getPrinters, updatePrinter } from "./store";
import { TabBrowser } from "../extends/tab-browser";

export let mainWindow: TabBrowser

if (require("electron-squirrel-startup")) {
  app.quit();
}
export const whatsAppService = new WhatsApp();
const main = () => {
  mainWindow = tabsWindow.createWindow();
  const printers = getPrinters()
  if (printers.length > 0) {
    printers.forEach((printer) => {
      if (!printer.margins) {
        updatePrinter({ id: printer.id, margins: { marginType: 'none' } })
      }
      if (!printer.scaleFactor) {
        updatePrinter({ id: printer.id, scaleFactor: 100 })
      }
    })
  }
  dialog.showErrorBox(process.env.EXEMPLO, 'teste')
};

if (isDev && process.platform === "win32") {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  // Setting this is required to get this working in dev mode.
  app.setAsDefaultProtocolClient(
    "whatsmenu-whatsapp-bot-dev",
    process.execPath,
    [path.resolve(process.argv[1]), ""]
  );
} else {
  app.setAsDefaultProtocolClient("whatsmenu-whatsapp-bot");
}

const goTheLock = app.requestSingleInstanceLock();

if (!goTheLock) {
  app.quit();
}

app.on("ready", main);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ipcMain.on('polling', async (eventsPolling) => {
//   try {
//     console.log('evento', eventsPolling)
    
//   } catch (error) {
//     console.error('erro ao enviar o polling', error)
//   }
// })

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    main();
  }
});
