import { Notification } from "electron";
import isDev from "electron-is-dev";
import child_process from "node:child_process";
import { promisify } from "util";
import { Client, ClientOptions, ContactId, LocalAuth } from "whatsapp-web.js";

import { EventEmitter } from "node:events";

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
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process", // Desativar o modo de processamento único - comentar caso seja necessário utilizar headless
      ],
    };
    if (!isDev || process.platform === "win32") {
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

    this.bot = new Client(config);
    this.bot.on("qr", (qr) => {
      // this.firstConection = true;
    });

    this.bot.on("ready", async () => {
      if (this.firstConection) {
        console.log("Checando número", this.bot.info.wid.user);
        console.time("firstconnection");
        try {
          // const validatedContact = await this.checkNinthDigit(
          //   this.bot.info.wid.user
          // );
          await this.bot.sendMessage(
            `${this.bot.info.wid.user}@c.us`,
            "Ola! Robô iniciado com sucesso"
          );
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
    setTimeout(() => {
      for (const messageQueued of this.messagesQueue) {
        const { contact, message } = messageQueued;
        // const validatedContact = await this.checkNinthDigit(contact);
        try {
          setTimeout(() => {
            this.bot.sendMessage(`${contact}`, message);
          }, 1000);
        } catch (error) {
          console.error(error);
        }
        this.messagesQueue.slice(this.messagesQueue.indexOf(messageQueued), 1);
      }
    }, 5 * 1000);
  }

  checkNinthDigit = async (contact: string): Promise<string> => {
    try {
      let contactId: ContactId;
      if (
        contact.startsWith("55") &&
        contact.length === 13 &&
        contact[4] === "9"
      ) {
        contactId = await this.bot.getNumberId(
          contact.slice(0, 4) + contact.slice(5)
        );
      }

      if (!contactId) {
        contactId = await this.bot.getNumberId(contact);
      }

      if (contactId) {
        contact = contactId._serialized;
        return contact;
      } else {
        throw new Error("Contato inválido!");
      }
    } catch (error) {
      console.error(error);

      throw new Error("Contato inválido!", { cause: "checkNinthDigit" });
    }
  };
}
