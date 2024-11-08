import { Notification } from "electron";
import isDev from "electron-is-dev";
import { whatsAppService } from "../main";
import {
  deleteVoucherToNotify,
  findCacheContact,
  getProfile,
  getVoucherToNotifyList,
  removeDuplicateUsers,
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
import { formatDDIBotMessage } from "../utils/ddi-bot-message";

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
      removeDuplicateUsers();
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

        if (jid === "Número não está no whatsapp") {
          return;
        }

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
    const removeExpiredVouchers = async () => {
      getVoucherToNotifyList().forEach((user) => {
        user.vouchers.filter(
          (voucher) =>
            voucher.expirationDate === null
        ).forEach((voucher) => deleteVoucherToNotify(voucher.id));
      })
    };

    const cronLoop = async (messageType: keyof typeof botMessages.cashback) => {

      const profile = getProfile();
      const vouchersFromAllUsers = getVoucherToNotifyList();
      const language = profile.options.locale.language;
      let list: VoucherNotification[] = [];
      switch (messageType) {
        case "afterPurchase":
          list = vouchersFromAllUsers.filter(
            (user) =>
              user.vouchers.some((voucher) =>
                voucher.afterPurchaseDate !== null &&
                DateTime.fromISO(voucher.afterPurchaseDate).diffNow(["minutes"])
                  .minutes <= 0
              )
          );
          break;
        case "remember":
          list = vouchersFromAllUsers.filter(
            (user) =>
              user.vouchers.some((voucher) =>
                voucher.rememberDate !== null &&
                DateTime.fromISO(voucher.rememberDate).diffNow(["days"])
                  .days <= 0
              )
          );
          break;
        case "expiration":
          list = vouchersFromAllUsers.filter(
            (user) =>
              user.vouchers.some((voucher) =>
                voucher.expirationDate !== null &&
                DateTime.fromISO(voucher.expirationDate).diffNow(["days"])
                  .days <= 0
              )
          );
          break;
        default:
          break;
      }

      for await (const user of list) {
        const { ddi } = formatDDIBotMessage({ language });
        const [{ jid }] = await whatsAppService.checkNumber(`${ddi}${user.whatsapp}`);
        const voucher = user.vouchers.find((v) => v[`${messageType}Date`] <= DateTime.local().toISO());

        if (jid === "Número não está no whatsapp") {
          voucher.expirationDate <= DateTime.local().toISO() &&
            deleteVoucherToNotify(voucher.id);
          return;
        }

        if (voucher[`${messageType}Date`] === null) {
          return;
        } else {
          await whatsAppService.sendMessageToContact(
            jid,
            { text: botMessages.cashback[messageType]({ user, voucher, profile }) }
          );
          switch (messageType) {
            case "afterPurchase":
              updateVoucherToNotify(voucher.id, {
                afterPurchaseDate: null,
              });
              break;
            case "remember":
              updateVoucherToNotify(voucher.id, {
                rememberDate: null
              });
              break;
            case "expiration":
              updateVoucherToNotify(voucher.id, {
                expirationDate: null
              });
              break;
            default:
              break;
          }
        }
      }
    };
    setInterval(() => {
      vouchersToNotifyQueue.push(async () => {
        await removeExpiredVouchers();
        await cronLoop("afterPurchase");
        await cronLoop("remember");
        await cronLoop("expiration");
      });
    }, 1000 * 60);
    return;
  }
}
