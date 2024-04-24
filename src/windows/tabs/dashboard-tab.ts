import { WebContentsView, screen } from "electron"
import path from "node:path"

let dashBoardTab
export const create_dashboard_tab = () => {
  const { width, height } = screen.getPrimaryDisplay().size
  const tab = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  tab.setBounds({ x: 0, y: 50, width, height: height - 185 })
  tab.webContents.loadURL(`https://next.whatsmenu.com.br/`)
  tab.webContents.openDevTools()

  tab.webContents.on('did-finish-load', () => {
    dashBoardTab = tab
  })
  return tab
}