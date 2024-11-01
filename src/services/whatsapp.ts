import { Notification } from "electron";
import isDev from "electron-is-dev";
import { Client, ClientOptions, LocalAuth } from "whatsapp-web.js";
import { whatsAppService } from "../main";
import {
  deleteVoucherToNotify,
  findCacheContact,
  getProfile,
  getVoucherToNotifyList,
  removeDuplicateVouchers,
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
    if (
      !store.get("configs.executablePath") ||
      !isDev ||
      process.platform === "win32"
    ) {
      config.puppeteer.executablePath =
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
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
      removeDuplicateVouchers();
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
        const [{ jid }] = await whatsAppService.checkNumber(contact);

        try {
          setTimeout(() => {
            whatsAppService.sendMessageToContact(jid, { text: message });
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
    const removeExpiredVouchers = async () => {
      getVoucherToNotifyList()
        .filter(
          (voucher) =>
            voucher.expirationDate &&
            DateTime.fromISO(voucher.expirationDate).diffNow(["minutes"])
              .minutes < -2
        )
        .forEach((voucher) => deleteVoucherToNotify(voucher.id));
    };
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
        const [{ jid }] = await whatsAppService.checkNumber(
          `55${voucher.client.whatsapp}`
        );
        await whatsAppService.sendMessageToContact(jid, {
          text: botMessages.cashback[messageType]({ voucher, profile }),
        });
        await whatsAppService.sendMessageToContact(jid, {
          text: botMessages.cashback[messageType]({ voucher, profile }),
        });
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
        await removeExpiredVouchers();
        await cronLoop("afterPurchase");
        await cronLoop("remember");
        await cronLoop("expire");
      });
    }, 1000 * 60);
    return;
  }
}
