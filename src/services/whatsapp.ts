import { Notification } from "electron";
import isDev from "electron-is-dev";
import child_process from "node:child_process";
import { promisify } from "util";
import WAWebJS, { Client, ClientOptions, LocalAuth } from "whatsapp-web.js";
import {
  deleteVoucherToNotify,
  findCacheContact,
  getProfile,
  getVoucherToNotifyList,
  store,
  updateVoucherToNotify,
} from "./../main/store";

import { EventEmitter } from "node:events";
import { ClientType } from "../@types/client";

import { DateTime } from "luxon";
import { VoucherNotification } from "../@types/store";
import { vouchersToNotifyQueue } from "../lib/queue";
import { botMessages } from "../utils/bot-messages";

export class WhatsApp {
  messagesQueue: Array<{
    contact: string;
    message: string;
    client?: ClientType;
  }> = [];
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
      headless: !store.get("configs.whatsapp.showHiddenWhatsApp"),
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
    if (
      !store.get("configs.executablePath") ||
      !isDev ||
      process.platform === "win32"
    ) {
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

    if (store.get("configs.executablePath")) {
      config.puppeteer.executablePath = store.get("configs.executablePath");
    }

    this.bot = new Client(config);
    this.bot.on("qr", () => {
      // this.firstConection = true;
    });

    this.bot.on("ready", async () => {
      new Notification({
        title: "Robô pronto!",
        body: "Pronto para enviar mensagens",
      }).show();

      this.sendQueuedmessages();
      this.cashbackCron();
    });
    this.bot.on("disconnected", () => {
      new Notification({
        title: "Robô desconectado!",
        body: "Não será possível enviar mensagens",
      }).show();
    });

    // BOT MESSAGES
    this.bot.on("message", async (message) => {
      const profile = getProfile();
      const chat = await message.getChat();
      if (chat.isGroup || !profile.options.bot.whatsapp.welcomeMessage.status) {
        return;
      }
      const [penultimateMessage, lastMessage] = await chat.fetchMessages({
        limit: 2,
      });
      const firstMessage = !lastMessage;
      const penultimateMessageDate = DateTime.fromSeconds(
        penultimateMessage.timestamp
      );
      const lastMessageDate = lastMessage
        ? DateTime.fromSeconds(lastMessage.timestamp)
        : DateTime.local();

      const { days, hours } = lastMessageDate.diff(penultimateMessageDate, [
        "days",
        "hours",
      ]);

      if (
        firstMessage ||
        days > 0 ||
        hours >= 3 ||
        profile.options.bot.whatsapp.welcomeMessage.alwaysSend
      ) {
        const cachedContact = await findCacheContact(chat.id._serialized);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        // prettier-ignore
        await chat.sendMessage(cachedContact && cachedContact.messageType === "cupomFirst" ? profile.options.placeholders.cupomFirstMessage.replaceAll("[NOME]", message._data.notifyName ?? '') : profile.options.placeholders.welcomeMessage.replaceAll("[NOME]", message._data.notifyName ?? ""));
        await chat.markUnread();
      }
    });

    return this.bot;
  }
  async sendQueuedmessages() {
    setTimeout(async () => {
      for (const messageQueued of this.messagesQueue) {
        const { contact, message } = messageQueued;
        const contactId = this.checkNinthDigit(contact);

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

  cashbackCron() {
    const profile = getProfile();
    getVoucherToNotifyList()
      .filter(
        (voucher) =>
          voucher.expirationDate &&
          DateTime.fromISO(voucher.expirationDate).diffNow(["days"]).days < 0
      )
      .forEach((voucher) => deleteVoucherToNotify(voucher.id));
    const cronLoop = async (messageType: keyof typeof botMessages.cashback) => {
      let list: VoucherNotification[] = [];
      switch (messageType) {
        case "afterPurchase":
          list = getVoucherToNotifyList().filter(
            (voucher) =>
              voucher.afterPurchaseDate &&
              DateTime.fromISO(voucher.afterPurchaseDate).diffNow(["minutes"])
                .minutes <= 0
          );
          break;
        case "remember":
          list = getVoucherToNotifyList().filter(
            (voucher) =>
              voucher.rememberDate &&
              DateTime.fromISO(voucher.rememberDate).diffNow(["days"]).days <= 0
          );
          break;
        case "expire":
          list = getVoucherToNotifyList().filter(
            (voucher) =>
              voucher.expirationDate &&
              DateTime.fromISO(voucher.expirationDate).diffNow(["days"]).days <=
                0
          );
          break;
        default:
          break;
      }
      for await (const voucher of list) {
        const contact = this.checkNinthDigit(`55${voucher.client.whatsapp}`);
        await this.bot.sendMessage(
          contact._serialized,
          botMessages.cashback[messageType]({ voucher, profile })
        );
        switch (messageType) {
          case "afterPurchase":
            updateVoucherToNotify(voucher.id, {
              afterPurchaseDate: null,
            });
            break;
          case "remember":
            updateVoucherToNotify(voucher.id, {
              rememberDate: null,
            });
            break;
          case "expire":
            updateVoucherToNotify(voucher.id, {
              expirationDate: null,
            });
            break;
          default:
            break;
        }
      }
    };
    setInterval(() => {
      vouchersToNotifyQueue.push(async () => {
        await cronLoop("afterPurchase");
        await cronLoop("remember");
        await cronLoop("expire");
      });
    }, 1000 * 60);
    return;
  }

  checkNinthDigit = (contact: string): WAWebJS.ContactId => {
    if (contact.startsWith("55")) {
      if (
        contact.length === 13 &&
        contact[4] === "9" &&
        parseInt(contact.slice(2, 4)) > 28
      ) {
        contact = contact.slice(0, 4) + contact.slice(5);
      }
    } else {
      throw new Error("Invalid contact number");
    }

    const contactId: WAWebJS.ContactId = {
      user: contact,
      server: "c.us",
      _serialized: `${contact}@c.us`,
    };

    return contactId;
  };

  validateContact(
    callback: (contact: string) => Promise<WAWebJS.ContactId>,
    contact: string
  ): Promise<WAWebJS.ContactId> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Timeout", { cause: "timeout" }));
      }, 5 * 1000);
      callback(contact).then(resolve).catch(reject);
    });
  }
}
