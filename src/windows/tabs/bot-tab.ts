// import { dialog, screen } from "electron"
import path from "node:path"
import { whatsAppService } from "../../main"
import { WebTabContentsView } from "../../extends/tab"
import { DisconnectReason, ConnectionState } from "@whiskeysockets/baileys"

export const create_bot_tab = () => {
  
  const tab = new WebTabContentsView({
    id: "bot",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    tab.webContents.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/bot.html`);
  } else {
    tab.webContents.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/bot.html`
      )
    );
  }
  tab.setVisible(false)

  tab.webContents.on('did-finish-load', async () => {
    await whatsAppService.connect();
    // whatsAppService.socket.ev.on('connection.update', ({ qr }) => {
    //   tab.webContents.send("onqrcode", qr);
    //   tab.webContents.send("log", qr);
    // })

    const connectionUpdate = async (update: ConnectionState) => {
      const { connection } = update;
      const QRCodeGen = whatsAppService.socket.ev.on('connection.update', ({ qr }) => {
        tab.webContents.send("onqrcode", qr);
        tab.webContents.send("log", qr);
      })

      if (!connection) {
        QRCodeGen;
      } else {
        switch (connection) {
          case "connecting":
            tab.webContents.send("onloading", { percent: 50, message: 'carregando mensagens' });
            break;
          case "close":
            tab.webContents.send("ondisconnected", "disconnected");
            QRCodeGen;
            break;
          case "open":
            tab.webContents.send("onready");
            break;
        }
      }
    }

    whatsAppService.socket.ev.on('connection.update', connectionUpdate);

    // whatsAppService.socket.ev
    // whatsAppService.initBot()
    //   .then(() => {
    //     whatsAppService.bot.on("ready", () => {
    //       if (!whatsAppService.firstConection) {
    //         tab.webContents.send("onready");
    //       } else {
    //         whatsAppService.events.on("ready", () => {
    //           tab.webContents.send("onready");
    //         });
    //       }
    //     });
    
    //     whatsAppService.bot.on("qr", (qr) => {
    //       tab.webContents.send("onqrcode", qr);
    //       tab.webContents.send("log", qr);
    //     });
    
    //     whatsAppService.bot.on("loading_screen", (percent, message) => {
    //       tab.webContents.send("onloading", { percent, message });
    //     });
    
    //     whatsAppService.bot.on("disconnected", (reason) => {
    //       tab.webContents.send("ondisconnected", reason);
    //     });
    
    //     whatsAppService.bot.initialize().catch((err) => {
    //       console.error(err);
    //       tab.webContents.send("error", err);
    //       dialog.showErrorBox("Ops!", err);
    //     });
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //     tab.webContents.send("error", err);
    //     dialog.showErrorBox("Ops!", err);
    //   })
  })

  return tab
}
