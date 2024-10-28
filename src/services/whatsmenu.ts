import { mainWindow } from "../main";
import { whatsmenu_api } from "../lib/axios";
import { store } from "../main/store";

const getDesktopProfile = () => store.get("configs.profile") as any;

const updateClient = async ({ client }: { client: any }) => {
  const profile = getDesktopProfile();
  if (!client) {
    throw new Error("Client not found!");
  }
  if (!profile) {
    throw new Error("Profile not found!");
  }
  try {
    const { data } = await whatsmenu_api.patch(
      `/api/v2/business/${profile.slug}/client/${client.id}/update`,
      { client },
    );
    mainWindow.webContents.send("onmessagesend", data.client);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { updateClient };
