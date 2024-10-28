import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Qrcode } from "./components/qrcode";
import { Switch } from "./shadcn-ui/components/ui/switch";
import { ProfileType } from "../@types/profile";
import { whatsmenu_api } from "../lib/axios";
import { Ws, wsURL } from "../services/ws";
import { MerchantType } from "../@types/merchant";


const root = createRoot(document.body);

const BotRoot = () => {
  const [qrcode, setQrcode] = useState("");
  const [connected, setConnected] = useState(false);
  const [disconnectedReason, setDisconnectedReason] = useState<string | null>(
    null,
  );
  const [merchant, setMerchant] = useState<MerchantType | null>(null);

  const [loading, setLoading] = useState({
    status: true,
    message: null,
    percent: 0,
  });
  const [profile, setProfile] = useState<ProfileType | null>(null);

  const wsRef = useRef<Ws>(null);

  useEffect(() => {
    window.WhatsAppBotApi.onqrcode((_, qr: string) => {
      setLoading((state) => ({ ...state, status: false }));
      setQrcode(qr);
    });
    window.WhatsAppBotApi.onready(() => {
      setLoading((state) => ({ ...state, status: false }));
      setConnected(true);
    });
    window.WhatsAppBotApi.ondisconnected((_, reason) => {
      setDisconnectedReason(reason);
      setConnected(false);
      setQrcode("");
    });
    window.WhatsAppBotApi.onloading((event, { message, percent }) => {
      setLoading(() => ({ status: true, message, percent }));
      setQrcode("");
    });

    window.DesktopApi.onProfileChange((event, data) => {
      setProfile(data);
    });

    window.DesktopApi.getMerchant();
    window.DesktopApi.getProfile();
  }, [connected]);

  useEffect(() => {
    if (profile) {      
      wsRef.current = new Ws({ url: window.env().WM_WEBSOCKET as wsURL });
      wsRef.current.connection.on("connect", () => {
        wsRef.current.join(`${profile.slug}:voucher`);
        wsRef.current.connection.on("voucher:avaliable", (voucher) => {
            window.DesktopApi.onVoucher(voucher);
        });
        wsRef.current.connection.on("voucher:used", (voucher) => {
          window.DesktopApi.removeVoucher(voucher);
        });
        wsRef.current.connection.on("voucher:cancelled", (voucher) => {
          window.DesktopApi.removeVoucher(voucher);
        });
      });
    }
  }, [profile]);

  const handleWhatsBotConfig = async (
    whatsapp: ProfileType["options"]["bot"]["whatsapp"],
  ) => {
    if (profile) {
      try {
        const { data } = await whatsmenu_api.post("/api/v2/bot/whatsapp", {
          profileId: profile.id,
          whatsapp,
        });
        profile.options.bot.whatsapp = data.whatsapp;
        window.DesktopApi.storeProfile(profile);
        setProfile({ ...profile });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="relative">
        <img
          src="../../bot.png"
          alt="Minha Imagem"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 top-[75%] bg-gradient-to-b from-transparent to-white opacity-100"></div>
      </div>

      <div className="text-center text-gray-500 text-4xl ">
        <h2 className="font-bold">Robô de atendimento</h2>
        <p>WhatsMenu</p>
      </div>
      <Qrcode />
      {profile && connected && (
        <div className="flex divide-x-2">
          <div className="p-7">
            <Switch
              label="Envio do cardápio pelo robô"
              checked={profile.options.bot.whatsapp.welcomeMessage.status}
              onCheckedChange={(checked) => {
                handleWhatsBotConfig({
                  ...profile.options.bot.whatsapp,
                  welcomeMessage: {
                    ...profile.options.bot.whatsapp.welcomeMessage,
                    status: checked,
                  },
                });
              }}
            />
          </div>

          <div className="p-7">
            <Switch
              label="Não permitir falar com atendente"
              checked={profile.options.bot.whatsapp.welcomeMessage.alwaysSend}
              onCheckedChange={(checked) => {
                handleWhatsBotConfig({
                  ...profile.options.bot.whatsapp,
                  welcomeMessage: {
                    ...profile.options.bot.whatsapp.welcomeMessage,
                    alwaysSend: checked,
                  },
                });
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
};

root.render(<BotRoot />);
