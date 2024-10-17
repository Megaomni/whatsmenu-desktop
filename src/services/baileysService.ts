import {
    useMultiFileAuthState,
    makeInMemoryStore,
    makeWASocket,
    ConnectionState,
    AnyMessageContent,
    WAMessage
} from '@whiskeysockets/baileys';
import { getProfile, setCacheContactByWhatsapp, getCacheContactList, removeDuplicateVouchers, setContactWelcomeMessage } from '../main/store';
import { EventEmitter } from 'events';
import { app } from 'electron';
import { WhatsApp } from './whatsapp';

const whatsapp = new WhatsApp();

export class BaileysService {
    socket: ReturnType<typeof makeWASocket> | null = null;
    private store = makeInMemoryStore({});
    private messageHistory: WAMessage[] = []
    events = new EventEmitter();

    /**
     * Checa se a diferença entre os dois horários é maior que o tempo dado em horas.
     * Caso seja a primeira mensagem, retorna true
     * @param {number | Long | undefined} currTime horário da mensagem atual.
     * @param {number | Long | undefined} prevTime horário da última mensagem.
     * @param {number} timespan intervalo de tempo em horas.
     * @returns {boolean} true se a diferença de tempo entre as mensagens é maior ou igual ao valor passado, ou se é a primeira mensagem do usuário.
     */
    timeDifference = (currTime: number | Long | undefined, prevTime: number | Long | undefined, timespan: number): boolean => {
        if (!prevTime) {
            return true;
        } else {
            const diff = Number(currTime) - Number(prevTime);
            return diff >= timespan * 3600; // conta para converter horas para segundos.
        }
    }


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
            return this.socket.onWhatsApp(number);
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

            if (!exists) {
                throw new Error("Number not found");
            }
            return this.socket.sendMessage(jid, message);
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
        this.store.readFromFile("./baileys_store.json");
        setInterval(() => {
            this.store.writeToFile("./baileys_store.json");
        }, 10000);

        const { state, saveCreds } = await useMultiFileAuthState("auth");

        this.socket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            browser: ['WhatsMenu', '', app.getVersion()],
            generateHighQualityLinkPreview: true,
            qrTimeout: 15000,
        });
        this.store.bind(this.socket.ev);

        this.socket.ev.on('chats.upsert', () => {
            console.log("got chats", this.store.chats.all());
        });

        this.socket.ev.on("contacts.upsert", () => {
            console.log("got contacts", Object.values(this.store.contacts));
        })

        this.socket.ev.on("creds.update", saveCreds);

        const connectionUpdate = async (update: ConnectionState) => {
            this.events.emit("connectionUpdate", update);

            const { connection } = update;
            console.log("connection update", connection);

            await saveCreds();
        }

        this.socket.ev.on('connection.update', connectionUpdate);

        this.socket.ev.on("messages.upsert", async (m) => {
            await whatsapp.sendQueuedmessages();
            whatsapp.cashbackCron();
            removeDuplicateVouchers();
            let currPhoneNum: string | undefined = undefined;
            const isMessageFromMe = Boolean(m.messages[0].key.fromMe);
            const isMessageFromGroup = Boolean(m.messages[0].key.participant);

            if (!isMessageFromGroup) {
                this.messageHistory.push(m.messages[0]);
                currPhoneNum = m.messages[0].key.remoteJid;
            }

            const profile = getProfile();
            const fullCachedContactList = getCacheContactList();
            const cachedContact = fullCachedContactList.find((customer) => customer.contact === currPhoneNum);

            if (cachedContact && cachedContact.messageType === "cupomFirst") {
                setContactWelcomeMessage(cachedContact)
            } else if (!cachedContact) {
                setCacheContactByWhatsapp(currPhoneNum, {
                    contact: currPhoneNum,
                    messageType: profile.firstOnlyCupom ? "cupomFirst" : "welcome",
                });
            }

            const messagesFromSender = this.messageHistory.filter((m) => !isMessageFromMe && m.key.remoteJid === currPhoneNum);
            const myMessages = this.messageHistory.filter((m) => isMessageFromMe && m.key.remoteJid === currPhoneNum);
            const currTime = messagesFromSender[messagesFromSender.length - 1].messageTimestamp;
            const prevTime = messagesFromSender.length > 1 ? messagesFromSender[messagesFromSender.length - 2].messageTimestamp : undefined;
            const myLastMsgTime = myMessages.length > 0 ? myMessages[myMessages.length - 1].messageTimestamp : undefined;
            const dontDisturb = profile.options.bot.whatsapp.welcomeMessage.alwaysSend;

            if (dontDisturb && this.timeDifference(currTime, myLastMsgTime, 0) && !isMessageFromMe && !isMessageFromGroup) {
                if (profile.firstOnlyCupom && (!cachedContact || cachedContact.messageType === "cupomFirst")) {
                    await this.sendMessageToContact(
                        currPhoneNum,
                        { text: profile.options.placeholders.cupomFirstMessage.replace("[NOME]", m.messages[0].pushName) });
                } else {
                    await this.sendMessageToContact(
                        currPhoneNum,
                        { text: profile.options.placeholders.welcomeMessage.replace("[NOME]", m.messages[0].pushName) });
                }
            } else if (!isMessageFromMe && !isMessageFromGroup && this.timeDifference(currTime, prevTime, 3) && this.timeDifference(currTime, myLastMsgTime, 5) && !dontDisturb) {
                if (profile.firstOnlyCupom && (!cachedContact || cachedContact.messageType === "cupomFirst")) {
                    await this.sendMessageToContact(
                        currPhoneNum,
                        { text: profile.options.placeholders.cupomFirstMessage.replace("[NOME]", m.messages[0].pushName) });
                } else {
                    await this.sendMessageToContact(
                        currPhoneNum,
                        { text: profile.options.placeholders.welcomeMessage.replace("[NOME]", m.messages[0].pushName) });
                }
            }
        })
    }
}
