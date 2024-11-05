import path from "node:path";
import { whatsAppService } from "../../main";
import { WebTabContentsView } from "../../extends/tab";
import { ConnectionState, DisconnectReason } from "@whiskeysockets/baileys";
import fs from "fs";
import { Boom } from "@hapi/boom";
import { store } from "../../main/store";
import { ProfileType } from "../../@types/profile";
import { DateTime } from "luxon";
import axios from "axios";

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

  const sendToWebhook = async (message: string) => {
    try {
      await axios.post("https://whatsmenu.com.br/webhook", message);
    } catch (err) {
      console.error(err);
    }
  };

  const botDebugger = async (discReason: number) => {
    if (discReason !== 408 && discReason !== 440 && discReason !== 515) {
      const profile = store.get("configs.profile") as ProfileType;
      let reason: string;
      switch (discReason) {
        case 500:
          reason = "bad session";
          break;
        case 440:
          reason = "connection replaced";
          break;
        case 401:
          reason = "logged out";
          break;
        case 503:
          reason = "unavailable service";
          break;
        default:
          reason = `unknown - code: ${discReason}`;
          break;
      }
      const debugMessage = `${DateTime.local().toFormat("dd/MM/yyyy HH:mm:ss")}
      O estabelecimento ${profile.name} foi desconectado - ${reason}`;
      await sendToWebhook(debugMessage);
      console.log(debugMessage);
    }
  };

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

      switch (connection) {
        case "connecting":
          tab.webContents.send("onloading", {
            percent: 50,
            message: "carregando mensagens",
          });
          break;
        case "close":
          botDebugger(lastDiscReason);
          switch (lastDiscReason) {
            case DisconnectReason.restartRequired ||
              DisconnectReason.timedOut ||
              DisconnectReason.connectionLost ||
              DisconnectReason.connectionReplaced ||
              DisconnectReason.connectionClosed:
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
            case DisconnectReason.badSession:
              console.log("Bad session");
              tab.setVisible(true);
              tab.webContents.reload();
              break;
            case DisconnectReason.loggedOut:
              console.log("Logged out");
              tab.setVisible(true);
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
              tab.webContents.reload();
              break;
            default:
              console.log(
                "Disconnect reason: ",
                DisconnectReason[lastDiscReason]
              );
              tab.webContents.reload();
              tab.setVisible(true);
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
