import { Notification } from "electron";
import isDev from "electron-is-dev";
import child_process from "node:child_process";
import { promisify } from "util";
import WAWebJS, { Client, ClientOptions, LocalAuth } from "whatsapp-web.js";

import { EventEmitter } from "node:events";
import { store } from "../main/store";

export class WhatsApp {
  messagesQueue: Array<{ contact: string; message: string }> = [];
  bot: Client | null = null;
  firstConection = false;
  events = new EventEmitter();
  /**
   * Constructor for the class with optional client options.
   *
   * @param {ClientOptions} [config] - Optional configuration for the client
   */

  async initBot(config?: ClientOptions) {
    if (!config) {
      config = {};
    }
    config.authStrategy = new LocalAuth();
    config.puppeteer = {
      headless: !store.get('configs.whatsapp.showHiddenWhatsApp'),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        // "--single-process", // Desativar o modo de processamento único - comentar caso seja necessário utilizar headless
      ],
    };
    if (!store.get('configs.executablePath') || (!isDev || process.platform === "win32")) {
      const command =
        'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe"';

      try {
        const { stderr, stdout } = await promisify(child_process.exec)(command);
        if (stderr) {
          console.error(stderr);
        }
        if (stdout) {
          const match = stdout.match(/(.*)(REG_SZ\s+)(.*)/);
          const chromePath = match && match[3];

          config.puppeteer.executablePath = chromePath;
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (store.get('configs.executablePath')) {
      config.puppeteer.executablePath = store.get('configs.executablePath')
    }

    this.bot = new Client(config);
    this.bot.on("qr", (qr) => {
      // this.firstConection = true;
    });

    this.bot.on("ready", async () => {
      if (this.firstConection) {
        console.log("Checando número", this.bot.info.wid.user);
        console.time("firstconnection");
        try {
          // const chat = await this.checkNinthDigit(
          //   this.bot.info.wid.user
          // );
          // if (chat) {
          //   chat.sendMessage("Ola! Robô iniciado com sucesso")
          // } else {
            await this.bot.sendMessage(
              `${this.bot.info.wid.user}@c.us`,
              "Ola! Robô iniciado com sucesso"
            );
          // }
        } catch (error) {
          console.error(error);
        } finally {
          console.timeEnd("firstconnection");
        }

        this.events.emit("ready");
        this.firstConection = false;
      }
      new Notification({
        title: "Robô pronto!",
        body: "Pronto para enviar mensagens",
      }).show();

      this.sendQueuedmessages();
    });
    this.bot.on("disconnected", () => {
      new Notification({
        title: "Robô desconectado!",
        body: "Não será possível enviar mensagens",
      }).show();
    });
    return this.bot;
  }
  async sendQueuedmessages() {
    setTimeout(async () => {
      for (const messageQueued of this.messagesQueue) {
        const { contact, message } = messageQueued;
        // const chat = await this.checkNinthDigit(contact);

        try {
          setTimeout(() => {
            // if (chat) {
            //   chat.sendMessage(message);              
            // } else {
              this.bot.sendMessage(`${contact}@c.us`, message);
            // }
          }, 1000);
        } catch (error) {
          console.error(error);
        }
        this.messagesQueue.slice(this.messagesQueue.indexOf(messageQueued), 1);
      }
    }, 5 * 1000);
  }

  checkNinthDigit = async (contact: string): Promise<WAWebJS.Chat> => {
    try {
      let chat: WAWebJS.Chat
      if (
        contact.startsWith("55") &&
        contact.length === 13 &&
        contact[4] === "9"
      ) {
        chat = await this.bot.getChatById(
          `${contact.slice(0, 4) + contact.slice(5)}@c.us`
        );
      }

      if (!chat) {
        chat = await this.bot.getChatById(`${contact}@c.us`);
      }

      return chat
    } catch (error) {
      console.error(error);
      throw error
    }
  };
}
