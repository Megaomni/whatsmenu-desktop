import {
    useMultiFileAuthState,
    Browsers,
    DisconnectReason,
    makeInMemoryStore,
    makeWASocket,
    ConnectionState,
    AnyMessageContent,
    WAMessage
} from '@whiskeysockets/baileys';
import { EventEmitter } from 'events';
import { Boom } from "@hapi/boom";
import fs from "fs";
import { boolean } from 'zod';

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

    connect = async () => {
        this.store.readFromFile("./baileys_store.json");
        setInterval(() => {
            this.store.writeToFile("./baileys_store.json");
        }, 10000);

        const { state, saveCreds } = await useMultiFileAuthState("auth");

        // const authFolder = "C:/projects/whatsmenu/apps/desktop/auth";
        // if (DisconnectReason && fs.existsSync(authFolder)) {
        //     fs.rmdirSync(authFolder, { recursive: true });
        // }

        this.socket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            browser: Browsers.windows("Mobile"),
            generateHighQualityLinkPreview: true,
            qrTimeout: 15000,
        });
        this.store.bind(this.socket.ev);

        this.socket.ev.on('chats.upsert', () => {
            // console.log("got chats", this.store.chats.all());
        });

        this.socket.ev.on("contacts.upsert", () => {
            // console.log("got contacts", Object.values(this.store.contacts));
        })

        this.socket.ev.on("creds.update", saveCreds);

        const checkNumber = async (number: string) => {
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

        const sendMessageToContact = async (number: string, message: AnyMessageContent) => {
            try {
                if (!this.socket) {
                    await this.connect();
                    await new Promise((res) => setTimeout(res, 5000));
                }
                const [{ jid, exists }] = await checkNumber(number);
                if (!exists) {
                    throw new Error("Number not found");
                }
                return this.socket.sendMessage(jid, message);
            } catch (e) {
                console.error(e);
                throw e;
            }
        }

        const connectionUpdate = async (update: ConnectionState) => {
            this.events.emit("connectionUpdate", update);

            const { connection, lastDisconnect } = update;
            console.log("connection update", connection);
            console.log("last disconnect", lastDisconnect);

            await saveCreds();
        }

        this.socket.ev.on('connection.update', connectionUpdate);

        this.socket.ev.on("messages.upsert", async (m) => {
            let currPhoneNum: string | undefined = undefined;
            const isMessageFromMe = Boolean(m.messages[0].key.fromMe);
            const isMessageFromGroup = Boolean(m.messages[0].key.participant);
            if (!isMessageFromGroup) {
                this.messageHistory.push(m.messages[0]);
                currPhoneNum = m.messages[0].key.remoteJid;
            }

            const messagesFromSender = this.messageHistory.filter((m) => !isMessageFromMe && m.key.remoteJid === currPhoneNum);
            const myMessages = this.messageHistory.filter((m) => isMessageFromMe && m.key.remoteJid === currPhoneNum);

            const currTime = messagesFromSender[messagesFromSender.length - 1].messageTimestamp;
            const prevTime = messagesFromSender.length > 1 ? messagesFromSender[messagesFromSender.length - 2].messageTimestamp : undefined;
            const myLastMsgTime = myMessages.length > 0 ? myMessages[myMessages.length - 1].messageTimestamp : undefined;


            if (!isMessageFromMe && !isMessageFromGroup && this.timeDifference(currTime, prevTime, 3) && this.timeDifference(currTime, myLastMsgTime, 5)) {
                await sendMessageToContact(m.messages[0].key.remoteJid, { text: `Eaí ${m.messages[0].pushName}, beleza?` });
            }
        })
    }
}