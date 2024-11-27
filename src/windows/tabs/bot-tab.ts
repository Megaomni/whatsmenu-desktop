import path from "node:path";
import { whatsAppService } from "../../main";
import { WebTabContentsView } from "../../extends/tab";
import { ConnectionState, DisconnectReason } from "@whiskeysockets/baileys";
import fs from "fs";
import { Boom } from "@hapi/boom";

export const create_bot_tab = () => {
  const tab = new WebTabContentsView({
    id: "bot",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    tab.webContents.loadURL(
      `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/bot.html`
    );
  } else {
    tab.webContents.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/bot.html`
      )
    );
  }
  tab.setVisible(false);

  tab.webContents.on("did-finish-load", async () => {
    whatsAppService.events.removeAllListeners();
    await whatsAppService.connect();
    let needRefreshOnDisconnect = false;

    /**
     * Recarrega a aba atual e a torna visível.
     */
    const refreshTab = () => {
      if (needRefreshOnDisconnect) {
        tab.webContents.reload();
        tab.setVisible(true);
      }
    }

    /**
     * Função chamada a cada mudança do estado da conexão do WhatsApp.
     * @param {ConnectionState} update - atualiza o do estado da conexão.
     * @returns {Promise<void>}
     */
    const connectionUpdate = (update: ConnectionState) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        tab.webContents.send("onqrcode", qr);
        tab.webContents.send("log", qr);
        needRefreshOnDisconnect = false;
        return;
      }

      let appStateFilesInAuth: number;

      if (fs.existsSync(whatsAppService.appDataPath)) {
        fs.readdir(whatsAppService.appDataPath, (err: NodeJS.ErrnoException | null, files: string[]) => {
          const allAppState = files.filter((file) => file.startsWith("app-state-sync-"));
          appStateFilesInAuth = allAppState.length;
        });
      }

      const lastDiscReason = (lastDisconnect?.error as Boom)?.output
        ?.statusCode;

      switch (connection) {
        case "connecting":
          tab.webContents.send("onloading", {
            percent: 50,
            message: "carregando mensagens",
          });
          needRefreshOnDisconnect = true;
          break;
        case "close":
          switch (lastDiscReason) {
            case DisconnectReason.restartRequired ||
              DisconnectReason.connectionLost ||
              DisconnectReason.connectionClosed ||
              DisconnectReason.unavailableService:
              tab.webContents.send(
                "log",
                `lastdisc - ${JSON.stringify({ lastDiscReason, DisconnectReason }, null, 2)}`
              );
              console.log(
                "Disconnect reason: ",
                DisconnectReason[lastDiscReason]
              );
              console.log("Reconnecting...");
              whatsAppService.connect();
              break;
            case DisconnectReason.timedOut:
              console.log("Timeout");
              appStateFilesInAuth > 20 ? whatsAppService.connect() : tab.webContents.reload();
              break;
            case DisconnectReason.badSession:
              console.log("Bad session");
              refreshTab();
              break;
            case DisconnectReason.connectionReplaced:
              console.log("Connection replaced");
              break;
            case DisconnectReason.loggedOut:
              console.log("Logged out");
              fs.rmdirSync(whatsAppService.appDataPath, { recursive: true });
              if (
                fs.existsSync(
                  "C:/projects/whatsmenu/apps/desktop/baileys_store.json"
                )
              ) {
                fs.rmSync(
                  "C:/projects/whatsmenu/apps/desktop/baileys_store.json"
                );
              }
              refreshTab();
              break;
            default:
              console.log(
                "Disconnect reason: ",
                DisconnectReason[lastDiscReason]
              );
              refreshTab();
              break;
          }
          tab.webContents.send("ondisconnected", "disconnected");
          break;
        case "open":
          needRefreshOnDisconnect = true;
          tab.webContents.send("onready");
          break;
      }
    };

    whatsAppService.events.on("connectionUpdate", connectionUpdate);
  });

  return tab;
};
