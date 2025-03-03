import { app, autoUpdater, dialog } from "electron";
import { mainWindow } from ".";
import { getProfile } from "./store";
import { tabsWindow } from "../windows/tabs-window";
import { whatsmenu_api_v3 } from "../lib/axios";


let url = "https://whatsmenu-desktop-update-server.vercel.app"
const checkForUpdates = async () => {
  try {
    const profileId = getProfile().id;
    const response = await whatsmenu_api_v3.get(`/user/${profileId}`);
    const server = response.data === 'staging' ? "https://whatsmenu-desktop-update-server-beta.vercel.app" : "https://whatsmenu-desktop-update-server.vercel.app";
    return `${server}/update/${process.platform}/${app.getVersion()}`;
  } catch (error) {
    console.error(error);
  }
}

checkForUpdates().then((result) => {
  url = result

  const UPDATE_CHECK_INTERVAL = 1000 * 60;

  const isMac = process.platform === "darwin";

  if (!isMac) {
    autoUpdater.setFeedURL({ url });

    autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName) => {
      const dialogOpts: Electron.MessageBoxOptions = {
        type: "info",
        buttons: ["Reiniciar e atualizar", "Mais tarde"],
        title: "Atualização disponível!",
        message: process.platform === "win32" ? releaseNotes : releaseName,
        detail:
          "Uma nova versão foi baixada. Reinicie o aplicativo para aplicar as atualizações.",
      };

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        // mainWindow.removeAllListeners()
        if (returnValue.response === 0) {
          tabsWindow.forceCloseWindow();
          autoUpdater.quitAndInstall();
        }
      });
    });

    autoUpdater.on("checking-for-update", () => {
      mainWindow.webContents.send("warn", "Bucando por novas atualizações...");
    });

    autoUpdater.on("update-available", () => {
      mainWindow.webContents.send(
        "warn",
        "Nova atualização disponível, baixando...",
      );
      clearInterval(updateInterval);
    });

    autoUpdater.on("error", (message) => {
      mainWindow.webContents.send("error", message);
      console.error("There was a problem updating the application");
      console.error(message);
    });

    const updateInterval = setInterval(() => {
      autoUpdater.checkForUpdates();
    }, UPDATE_CHECK_INTERVAL);
  }
})

