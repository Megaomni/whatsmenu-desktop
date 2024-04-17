import { Menu, Tray, app, nativeImage } from "electron";
import path from 'node:path';
import { mainWindow } from '.';
import { botWindow } from "../windows/bot-window";
import { whatsmenuWindow } from "../windows/whatsmenu-window";

app.whenReady().then(() => {
  const tray = new Tray(nativeImage.createFromPath(path.resolve(__dirname, './app_icon.png')).resize({ width: 16, height: 16 }))
  const menu = Menu.buildFromTemplate([
    { 
      icon: nativeImage.createFromPath(path.resolve(__dirname, './close_icon.png')).resize({ width: 16, height: 16 }),
      label: 'Encerrar',
      click: () => {
        whatsmenuWindow.forceCloseWindow()
        botWindow.forceCloseWindow()
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.restore()
      mainWindow.maximize()
    }
  })
})