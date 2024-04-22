import { Notification } from "electron";
import isDev from "electron-is-dev";
import child_process from "node:child_process";
import { promisify } from "util";
import WAWebJS, { Client, ClientOptions, LocalAuth } from "whatsapp-web.js";
import { store } from './../main/store';

import { EventEmitter } from "node:events";
import { resolveInFixedTime } from '../utils/resolve-in-fixed-time';
import { updateClient } from "./whatsmenu";
import { ClientType } from "../@types/client";

export class WhatsApp {
  messagesQueue: Array<{ contact: string; message: string, client?: ClientType }> = [];
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
    this.bot.on('message', (msg) => {
      if (msg.body.includes('whatsmenu.com.br')) {
        console.log(msg)
        this.bot.sendMessage(msg.author,'Pedido recebido!')
      }
    })
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
        const { contact, message, client } = messageQueued;
        const contactId = await this.checkNinthDigit(contact, client);

        try {
          setTimeout(() => {
            this.bot.sendMessage(contactId?._serialized, message);
          }, 1000);
        } catch (error) {
          console.error(error);
        }
        this.messagesQueue.slice(this.messagesQueue.indexOf(messageQueued), 1);
      }
    }, 5 * 1000);
  }

  checkNinthDigit = async (contact: string, client: ClientType): Promise<WAWebJS.ContactId> => {
    console.log(client,'client');
    if (client?.controls?.whatsapp?.contactId) {
      return client.controls.whatsapp.contactId
    }
    let contactId: WAWebJS.ContactId

    try {
      if (
        contact.startsWith("55") &&
        contact.length === 13 &&
        contact[4] === "9"
      ) {
        contactId = await resolveInFixedTime({ promise: this.bot.getNumberId(`${contact.slice(0, 4) + contact.slice(5)}`), secondsAwait: 5 })
      }

      if (!contactId) {
        contactId = await resolveInFixedTime({ promise: this.bot.getNumberId(contact), secondsAwait: 5 })
      }

      return contactId
    } catch (error) {
      if (error.cause === 'timeout') {
        const response = await fetch(`https://bot.whatsmenu.com.br/whatsapp/${contact}/check`, {
          headers: { 'Content-Type': 'application/json' },
        })
          .then(response => response.json())
          .then(data => {
            return data
          })
          .catch((err) => {
            throw err
          });

          if (!response.contactId) {
            throw new Error('contactId not found', { cause: "checkNinthDigit" })
          }
        return response.contactId
      } else {
        console.error(error);
        throw error
      }
    } finally {
      if (client?.controls) {
        client.controls.whatsapp = {
          contactId
        }
        updateClient({ client })
      }
    }
  };

  validateContact(callback: (contact: string) => Promise<WAWebJS.ContactId>, contact: string): Promise<WAWebJS.ContactId> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Timeout", { cause: 'timeout' }))
      }, 5 * 1000);
      callback(contact).then(resolve).catch(reject)
    })
  }
}
