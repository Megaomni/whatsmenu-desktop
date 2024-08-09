import path from "node:path";
import { WebTabContentsView } from "../../extends/tab";
import { env } from "../../environments";

export const create_dashboard_tab = () => {
  const tab = new WebTabContentsView({
    id: "dashboard",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  tab.webContents.loadURL(env.WM_DASHBOARD);

  return tab;
};
