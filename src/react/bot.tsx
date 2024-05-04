import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Qrcode } from './components/qrcode';
import { Switch } from './shadcn-ui/components/ui/switch';
import { Progress } from './shadcn-ui/components/ui/progress';
import { ProgressCircle } from './components/progress-circle';

const root = createRoot(document.body);

const BotRoot = () => {
  const [qrcode, setQrcode] = useState('');
  const [connected, setConnected] = useState(false)
  const [disconnectedReason, setDisconnectedReason] = useState<string | null>(null)
  const [loading, setLoading] = useState({ status: true, message: null, percent: 0 })
  
  useEffect(() => {
    window.WhatsAppBotApi.onqrcode((_ ,qr: string) => {
      setLoading((state) => ({ ...state, status: false }))
      setQrcode(qr)
    })
    window.WhatsAppBotApi.onready(() => {
      setLoading((state) => ({ ...state, status: false }))
      setConnected(true)
    })
    window.WhatsAppBotApi.ondisconnected((_, reason) => {
      setDisconnectedReason(reason)
      setConnected(false)
      setQrcode('')
    })
    window.WhatsAppBotApi.onloading((event, { message, percent }) => {
      setLoading(() => ({ status: true, message, percent }))
      setQrcode('')
    })
  }, [])

  return (
    <main className='flex flex-col items-center justify-center h-screen gap-4'>

      <div className="relative">
        <img src="../images/bot.png" alt="Minha Imagem" className="w-full h-full object-cover" />
        <div className="absolute inset-0 top-[75%] bg-gradient-to-b from-transparent to-white opacity-100"></div>
      </div>

      
      <div className='text-center text-gray-500 text-4xl '>
        <h2 className='font-bold'>Robô de atendimento</h2>
        <p>WhatsMenu</p>
      </div>
      <Qrcode />
      {connected && (
        <div className='flex divide-x-2'>
          <div className='p-7'>
            <Switch label="Envio do cardápio pelo robô" />
          </div>

          <div className='p-7'>
            <Switch label="Envio do cardápio pelo robô" />
          </div>
        </div>
      )}
    </main>
  )
}

root.render(<BotRoot />);