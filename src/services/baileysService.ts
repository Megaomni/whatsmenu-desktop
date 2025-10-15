import {
  useMultiFileAuthState,
  makeWASocket,
  ConnectionState,
  AnyMessageContent,
  WAMessage,
  isJidGroup,
  isJidUser
} from "@whiskeysockets/baileys";
import {
  getProfile,
  setCacheContactByWhatsapp,
  getCacheContactList,
  removeDuplicateVouchers,
  setContactWelcomeMessage,
  convertToTwoFactor,
} from "../main/store";
import { EventEmitter } from "events";
import { app } from "electron";
import { WhatsApp } from "./whatsapp";
import path from "node:path";
import os from "node:os";

const whatsapp = new WhatsApp();

export class BaileysService {
  socket: ReturnType<typeof makeWASocket> | null = null;
  private messageHistory: WAMessage[] = [];
  events = new EventEmitter();
  appData: string =
    process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  appDataPath = path.join(this.appData, "whatsmenu-desktop", "auth");

  /**
   * Checa se a diferença entre os dois horários é maior que o tempo dado em horas.
   * Caso seja a primeira mensagem, retorna true
   * @param {number | Long | undefined} currTime horário da mensagem atual.
   * @param {number | Long | undefined} prevTime horário da última mensagem.
   * @param {number} timespan intervalo de tempo em horas.
   * @returns {boolean} true se a diferença de tempo entre as mensagens é maior ou igual ao valor passado, ou se é a primeira mensagem do usuário.
   */
  timeDifference = (
    currTime: number | Long | undefined,
    prevTime: number | Long | undefined,
    timespan: number
  ): boolean => {
    if (!prevTime) {
      return true;
    } else {
      const diff = Number(currTime) - Number(prevTime);
      return diff >= timespan * 3600; // conta para converter horas para segundos.
    }
  };

  /**
   * Verifica se um determinado número de telefone está conectado no WhatsApp.
   * Se o número estiver conectado, retorna um objeto com as informações do contato.
   * Caso o número não esteja conectado, lança um erro.
   * @param {string} number número de telefone a ser verificado.
   * @returns {Promise<import('@whiskeysockets/baileys').WAContact>} objeto com as informações do contato.
   * @throws {Error} caso o número não esteja conectado.
   */
  async checkNumber(number: string) {
    try {
      if (!this.socket) {
        await this.connect();
        await new Promise((res) => setTimeout(res, 5000));
      }
      let checkObj = await this.socket.onWhatsApp(number);
      if (checkObj.length === 0) {
        checkObj = [{ jid: "Número não está no whatsapp", exists: false }];
      }
      return checkObj;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Envia uma mensagem para um contato no WhatsApp.
   * Verifica se o socket está conectado, caso não esteja, conecta-se.
   * Verifica se o número de telefone existe, caso não exista, lança um erro.
   * Envia a mensagem para o contato.
   * @param {string} number número de telefone a ser verificado.
   * @param {AnyMessageContent} message mensagem a ser enviada.
   * @returns {Promise<WAMessage>} objeto com as informações da mensagem enviada.
   * @throws {Error} caso o número não esteja conectado.
   */
  async sendMessageToContact(number: string, message: AnyMessageContent) {
    try {
      if (!this.socket) {
        await this.connect();
        await new Promise((res) => setTimeout(res, 5000));
      }
      const [{ jid, exists }] = await this.checkNumber(number);

      if ("text" in message && message.text === "") {
        console.error("Mensagem vazia");
        return;
      }

      if (!exists || jid === "Número não está no whatsapp") {
        return
      } else {
        return this.socket.sendMessage(jid, message);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Conecta ao WhatsApp e configura os listeners de eventos.
   * Lida com o armazenamento de credenciais, atualização de contatos, chats e mensagens.
   * Verifica se o número do contato existe e envia mensagens de boas-vindas ou de cupom.
   * Verifica se a diferença entre os horários de mensagens do contato é maior que 5 minutos.
   * Verifica se a diferença entre os horários de mensagens do contato é maior que 3 horas.
   * Verifica se a mensagem é do tipo "cupomFirst" e envia a mensagem de cupom.
   * Verifica se a mensagem é do tipo "welcome" e envia a mensagem de boas-vindas.
   * @returns {Promise<void>}
   */
  async connect() {
    await whatsapp.sendQueuedmessages();
    whatsapp.cashbackCron();
    removeDuplicateVouchers();
    convertToTwoFactor();
    const { state, saveCreds } = await useMultiFileAuthState(this.appDataPath);

    this.socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: ["WhatsMenu", "", app.getVersion()],
      version: [2, 3000, 1025190524],
      generateHighQualityLinkPreview: true,
    });

    this.socket.ev.on("creds.update", async () => {
      await saveCreds();
    });

    const connectionUpdate = async (update: ConnectionState) => {
      this.events.emit("connectionUpdate", update);

      const { connection } = update;
      console.log("connection update", connection);

      await saveCreds();
    };

    this.socket.ev.on("connection.update", connectionUpdate);

    this.socket.ev.on("messages.upsert", async (m) => {
      let currPhoneNum: string | undefined = undefined;
      const isMessageFromMe = Boolean(m.messages[0].key.fromMe);
      const isGroupMessage = Boolean(m.messages[0].key.participant || isJidGroup(m.messages[0].key.remoteJid));
      const shouldSendMessage = Boolean(!isGroupMessage && m.messages[0].pushName && isJidUser(m.messages[0].key.remoteJid));

      if (isGroupMessage) {
        return;
      }

      if (shouldSendMessage) {
        this.messageHistory.push(m.messages[0]);
        currPhoneNum = m.messages[0].key.remoteJid;
      }

      const profile = getProfile();
      const fullCachedContactList = getCacheContactList();
      const cachedContact = fullCachedContactList.find(
        (customer) => customer.contact === currPhoneNum
      );

      if (cachedContact && cachedContact.messageType === "cupomFirst") {
        setContactWelcomeMessage(cachedContact);
      } else if (!cachedContact) {
        setCacheContactByWhatsapp(currPhoneNum, {
          contact: currPhoneNum,
          messageType: profile.firstOnlyCupom ? "cupomFirst" : "welcome",
        });
      }

      const messagesFromSender = this.messageHistory.filter(
        (m) => !isMessageFromMe && m.key.remoteJid === currPhoneNum
      );
      const myMessages = this.messageHistory.filter(
        (m) => isMessageFromMe && m.key.remoteJid === currPhoneNum
      );
      const currTime =
        messagesFromSender[messagesFromSender.length - 1]?.messageTimestamp;
      const prevTime =
        messagesFromSender.length > 1
          ? messagesFromSender[messagesFromSender.length - 2].messageTimestamp
          : undefined;
      const myLastMsgTime =
        myMessages.length > 0
          ? myMessages[myMessages.length - 1].messageTimestamp
          : undefined;
      const alwaysSend =
        profile.options.bot.whatsapp.welcomeMessage.alwaysSend;
      const sendMenu =
        profile.options.bot.whatsapp.welcomeMessage.status;


      if (
        alwaysSend &&
        this.timeDifference(currTime, myLastMsgTime, 0) &&
        !isMessageFromMe
      ) {
        if (
          profile.firstOnlyCupom &&
          (!cachedContact || cachedContact.messageType === "cupomFirst")
        ) {
          await this.sendMessageToContact(currPhoneNum, {
            text: `Olá *${m.messages[0].pushName}!*\n\nSeja bem vindo ao ${profile.name}\n\nÉ sua primeira vez aqui, separei um cupom especial para você\n\nhttps://www.whatsmenu.com.br/${profile.slug}?firstOnlyCupom=${profile.firstOnlyCupom.code}\n\n 👆🏻 Cupom: *${profile.firstOnlyCupom.code}* 👆🏻 \n\nClique no link para fazer o pedido com o cupom`,
          });
        } else {
          sendMenu && await this.sendMessageToContact(currPhoneNum,
            { text: profile.options.placeholders.welcomeMessage.replace("[NOME]", m.messages[0].pushName) }
          );
        }
      } else if (
        !isMessageFromMe &&
        this.timeDifference(currTime, prevTime, 3) &&
        this.timeDifference(currTime, myLastMsgTime, 5) &&
        !alwaysSend
      ) {
        if (
          profile.firstOnlyCupom &&
          (!cachedContact || cachedContact.messageType === "cupomFirst")
        ) {
          await this.sendMessageToContact(currPhoneNum, {
            text: `Olá *${m.messages[0].pushName}!*\n\nSeja bem vindo ao ${profile.name}\n\nÉ sua primeira vez aqui, separei um cupom especial para você\n\nhttps://www.whatsmenu.com.br/${profile.slug}?firstOnlyCupom=${profile.firstOnlyCupom.code}\n\n 👆🏻 Cupom: *${profile.firstOnlyCupom.code}* 👆🏻 \n\nClique no link para fazer o pedido com o cupom`,
          });
        } else {
          sendMenu && await this.sendMessageToContact(currPhoneNum,
            { text: profile.options.placeholders.welcomeMessage.replace("[NOME]", m.messages[0].pushName) }
          );
        }
      }
    });
  }
}
