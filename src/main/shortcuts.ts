import { globalShortcut } from "electron";
import { TabBrowser } from "../extends/tab-browser";

/**
 * Registra atalhos globais para uma janela TabBrowser específica.
 *
 * @param {TabBrowser} window - A janela TabBrowser para a qual as atalhos serão registradas.
 * @return {void} Esta função não retorna nada.
 */
export const registerShortCuts = (window: TabBrowser): void => {
  window.on("focus", () => {
    globalShortcut.register("F5", () => {
      const tab = window.getCurrentTab();
      tab.webContents.reload();
    });
    globalShortcut.register("Shift+F5", () => {
      const tab = window.getCurrentTab();
      tab.webContents.reloadIgnoringCache();
    });
    globalShortcut.register("F12", () => {
      const tab = window.getCurrentTab();
      if (!tab.webContents.isDevToolsOpened()) {
        tab.webContents.openDevTools({ mode: "right" });
      } else {
        tab.webContents.closeDevTools();
      }
    });
    globalShortcut.register("CmdOrCtrl+C", () => {
      const tab = window.getCurrentTab();
      tab.webContents.copy();
    });
    globalShortcut.register("CmdOrCtrl+X", () => {
      const tab = window.getCurrentTab();
      tab.webContents.cut();
    });
    globalShortcut.register("CmdOrCtrl+A", () => {
      const tab = window.getCurrentTab();
      tab.webContents.selectAll();
    });
    globalShortcut.register("CmdOrCtrl+V", () => {
      const tab = window.getCurrentTab();
      tab.webContents.paste();
    });
    globalShortcut.register("CmdOrCtrl+Z", () => {
      const tab = window.getCurrentTab();
      tab.webContents.undo();
    });
    globalShortcut.register("CmdOrCtrl+Shift+Z", () => {
      const tab = window.getCurrentTab();
      tab.webContents.redo();
    });
  });

  window.on("blur", () => {
    globalShortcut.unregisterAll();
  });

  window.tabs.forEach((tab) => {
    tab.webContents.on("devtools-focused", () => {
      globalShortcut.unregisterAll();
    });
  });
};
