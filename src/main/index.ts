import { app, BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import path from "node:path";

import "../main/auto-update";
import "../main/ipc";
import "../main/menu";
import "../main/tray";
import "../services/ws_integration";
import "./sentry";

import { TabBrowser } from "../extends/tab-browser";
import { BaileysService } from "../services/baileysService";
import { tabsWindow } from "../windows/tabs-window";
import { convertPrinterLocation, fetchVouchers, getPrinters, setCategories, updatePrinter } from "./store";

export let mainWindow: TabBrowser;

if (require('electron-squirrel-startup')) {
  const squirrelEvent = process.argv[1];

  if (squirrelEvent === '--squirrel-install' || squirrelEvent === '--squirrel-updated') {
    setTimeout(() => {
      app.quit();
    }, 3000);
  }
}
export const whatsAppService = new BaileysService();
const main = async () => {
  mainWindow = tabsWindow.createWindow();
  const printers = getPrinters();
  await fetchVouchers();
  await setCategories();
  convertPrinterLocation();
  if (printers.length > 0) {
    printers.forEach((printer) => {
      if (!printer.margins) {
        updatePrinter({ id: printer.id, margins: { marginType: "none" } });
      }
      if (!printer.scaleFactor) {
        updatePrinter({ id: printer.id, scaleFactor: 100 });
      }
    });
  }
  // dialog.showErrorBox(process.env.EXEMPLO, 'teste')
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
  process.exit(0);
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("ready", main);
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      main();
    }
  });
}
