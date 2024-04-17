import path from 'node:path';
import { Menu, Tray, app, nativeImage } from "electron";

app.whenReady().then(() => {
  console.log(nativeImage.createFromPath(path.resolve(__dirname, 'app_icon.png')))
  const tray = new Tray(nativeImage.createFromPath('./app_icon.png').resize({ width: 16, height: 16 }))
  const menu = Menu.buildFromTemplate([
    {
      label: 'Robô WhatsApp',
    }
  ])
  tray.setContextMenu(menu)
})