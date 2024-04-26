
import path from "node:path"
import { WebTabContentsView } from "../../extends/tab"

export const create_dashboard_tab = () => {
  
  const tab = new WebTabContentsView({
    id: 'dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  tab.webContents.loadURL(`https://next.whatsmenu.com.br/`)

  return tab
}