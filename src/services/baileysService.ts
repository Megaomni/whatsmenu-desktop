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
import { Boom } from "@hapi/boom";
import fs from "fs";

export class BaileysService {
    socket: ReturnType<typeof makeWASocket> | null = null;
    private store = makeInMemoryStore({});
    private messageHistory: WAMessage[] = []

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
            const storeFile = 'C:/projects/whatsmenu/apps/desktop/baileys_store.json'
            const authFolder = "C:/projects/whatsmenu/apps/desktop/auth";

            const { connection, lastDisconnect } = update;
            console.log("connection update", connection);
            console.log("last disconnect", lastDisconnect);
            
            await saveCreds();
            if (connection === "close") {
                const lastDiscReason = (lastDisconnect.error as Boom).output.statusCode;
                switch (lastDiscReason) {
                    case DisconnectReason.restartRequired || DisconnectReason.timedOut || DisconnectReason.connectionLost || DisconnectReason.connectionClosed: 
                        console.log(DisconnectReason);
                        console.log("Reconnecting...");
                        this.connect();
                        break;
                    case DisconnectReason.badSession:
                        console.log("Bad session");
                        break;
                    case DisconnectReason.connectionReplaced:
                        console.log("Connection replaced");
                        break;
                    case DisconnectReason.loggedOut:
                        console.log("Logged out");
                        fs.rmdirSync(authFolder, { recursive: true });
                        fs.rmSync(storeFile);
                        break;
                    default:
                        console.log("Unknown reason");
                        break;
                }
            }
        }

        this.socket.ev.on('connection.update', connectionUpdate);

        this.socket.ev.on("messages.upsert", async (m) => {
            let currPhoneNum: string | undefined = undefined;
            if (!m.messages[0].key.participant) {
                this.messageHistory.push(m.messages[0]);
                currPhoneNum = m.messages[0].key.remoteJid;
            }
            
            const messagesFromSender = this.messageHistory.filter((m) => !m.key.fromMe && m.key.remoteJid === currPhoneNum);
            const myMessages = this.messageHistory.filter((m) => m.key.fromMe && m.key.remoteJid === currPhoneNum);

            
            /**
             * Checa se a diferença entre os dois horários é maior que o tempo dado em horas.
             * Caso seja a primeira mensagem, retorna true
             * @param {number | Long | undefined} currTime horário da mensagem atual.
             * @param {number | Long | undefined} prevTime horário da última mensagem.
             * @param {number} timespan intervalo de tempo em horas.
             * @returns {boolean} true se a diferença de tempo entre as mensagens é maior ou igual ao valor passado, ou se é a primeira mensagem do usuário.
             */
            const timeDifference = (currTime: number | Long | undefined, prevTime: number | Long | undefined, timespan: number): boolean => {
                if (!prevTime) {
                    return true;
                } else {
                    const diff = Number(currTime) - Number(prevTime);
                    return diff >= timespan * 3600; // conta para converter horas para segundos.
                }
            }

            const currTime = messagesFromSender[messagesFromSender.length - 1].messageTimestamp;
            const prevTime = messagesFromSender.length > 1 ? messagesFromSender[messagesFromSender.length - 2].messageTimestamp : undefined;
            const myLastMsgTime = myMessages.length > 0 ? myMessages[myMessages.length - 1].messageTimestamp : undefined;
            
            if (!m.messages[0].key.fromMe && !m.messages[0].key.participant && timeDifference(currTime, prevTime, 3) && timeDifference(currTime, myLastMsgTime, 5)) {
                await sendMessageToContact(m.messages[0].key.remoteJid, { text: `Eaí ${m.messages[0].pushName}, beleza?` });
            }
        })
    }
}