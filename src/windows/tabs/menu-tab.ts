import path from "node:path";
import { ProfileType } from "../../@types/profile";
import { store } from "../../main/store";
import { WebTabContentsView } from "../../extends/tab";
import { env } from "../../environments";

export const create_menu_tab = () => {
  const profile = store.get("configs.profile") as ProfileType;
  const tab = new WebTabContentsView({
    id: "menu",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  tab.setVisible(false);

  store.onDidChange("configs", (newValue) => {
    if (profile?.slug !== newValue.profile?.slug) {
      tab.webContents.loadURL(`${env.WM_STORE}/${newValue.profile.slug}`);
    }
  });

  return tab;
};
