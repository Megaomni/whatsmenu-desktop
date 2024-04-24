import { screen } from "electron"
import path from "node:path"
import { WebTabContentsView } from "../../extends/tab"

export const create_dashboard_tab = () => {
  const { width, height } = screen.getPrimaryDisplay().size
  const tab = new WebTabContentsView({
    id: 'dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  tab.setBounds({ x: 0, y: 50, width, height: height - 185 })
  tab.webContents.loadURL(`https://next.whatsmenu.com.br/`)
  tab.webContents.openDevTools()

  return tab
}