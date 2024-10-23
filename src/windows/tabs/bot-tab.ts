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
    await whatsAppService.connect();

    const connectionUpdate = async (update: ConnectionState) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        tab.webContents.send("onqrcode", qr);
        tab.webContents.send("log", qr);
        return;
      }

      const lastDiscReason = (lastDisconnect?.error as Boom)?.output
        ?.statusCode;
      const authFolder = "C:/projects/whatsmenu/apps/desktop/auth";

      switch (connection) {
        case "connecting":
          tab.webContents.send("onloading", {
            percent: 50,
            message: "carregando mensagens",
          });
          break;
        case "close":
          switch (lastDiscReason) {
            case DisconnectReason.restartRequired ||
              DisconnectReason.timedOut ||
              DisconnectReason.connectionLost ||
              DisconnectReason.connectionClosed:
              tab.webContents.send(
                "log",
                `lastdisc - ${JSON.stringify({ lastDiscReason, DisconnectReason }, null, 2)}`
              );
              console.log(DisconnectReason);
              console.log("Reconnecting...");
              whatsAppService.connect();
              break;
            case DisconnectReason.badSession:
              console.log("Bad session");
              break;
            case DisconnectReason.connectionReplaced:
              console.log("Connection replaced");
              break;
            case DisconnectReason.loggedOut:
              console.log("Logged out");
              fs.rmdirSync(authFolder, { recursive: true });
              if (
                fs.existsSync(
                  "C:/projects/whatsmenu/apps/desktop/baileys_store.json"
                )
              ) {
                fs.rmSync(
                  "C:/projects/whatsmenu/apps/desktop/baileys_store.json"
                );
              }
              break;
            default:
              console.log("Unknown reason");
              break;
          }
          tab.webContents.send("ondisconnected", "disconnected");
          break;
        case "open":
          tab.webContents.send("onready");
          break;
      }
    };

    whatsAppService.events.on("connectionUpdate", connectionUpdate);
  });

  return tab;
};
