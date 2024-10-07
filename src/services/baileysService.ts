import { useMultiFileAuthState, Browsers, DisconnectReason, makeInMemoryStore, makeWASocket, AnyMessageContent } from '@whiskeysockets/baileys';
import { Boom } from "@hapi/boom";


export class BaileysService {
    socket: ReturnType<typeof makeWASocket> | null = null;
    private store = makeInMemoryStore({});

    connect = async () => {
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
            browser: Browsers.windows("Mobile"),
            generateHighQualityLinkPreview: true,
        });
        this.store.bind(this.socket.ev);

        this.socket.ev.on('chats.upsert', () => {
            console.log("got chats", this.store.chats.all());
        });

        this.socket.ev.on("contacts.upsert", () => {
            console.log("got contacts", Object.values(this.store.contacts));
        })

        this.socket.ev.on("creds.update", saveCreds);

        this.socket.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;
            console.log("qr: ", qr);
            if (connection === "close") {
                const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
                saveCreds();
                shouldReconnect && this.connect();
            } else if (connection === "open") {
                console.log("opened connection");
            }
        })

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

        this.socket.ev.on("messages.upsert", async (m) => {
            console.log(JSON.stringify(m, undefined, 2));
            console.log("replying to ", m.messages[0].key.remoteJid);
            // await this.socket.sendMessage(m.messages[0].key.remoteJid, { text: 'Teste' });
            await sendMessageToContact(m.messages[0].key.remoteJid, { text: 'Teste' });
        })
    }
}