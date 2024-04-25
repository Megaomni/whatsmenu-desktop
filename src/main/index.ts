import { whatsmenuWindow } from "./../windows/whatsmenu-window";
import { app, BrowserWindow, dialog } from "electron";
import isDev from "electron-is-dev";
import path from "node:path";

import "../main/menu";
import "../main/ipc";
import "../main/auto-update";
import "../main/tray";

import { decodeDeepLinkMessage } from "../utils/decode-deep-link-message";
import { WhatsApp } from "../services/whatsapp";
import { botWindow } from "../windows/bot-window";
import { getPrinters, updatePrinter } from "./store";

export let mainWindow: BrowserWindow;

if (require("electron-squirrel-startup")) {
  botWindow.forceCloseWindow();
  app.quit();
}
export const whatsAppService = new WhatsApp();
const main = () => {
  mainWindow = whatsmenuWindow.createWindow();
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
  botWindow?.forceCloseWindow();
  app.quit();
}

app.on("ready", main);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    botWindow.forceCloseWindow();
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    main();
  }
});
