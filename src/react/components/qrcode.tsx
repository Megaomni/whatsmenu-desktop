import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { WhatsAppBotApi } from '../../preload';

interface ElectronWindow extends Window {
  WhatsAppBotApi: typeof WhatsAppBotApi
}

declare const window: ElectronWindow

export const Qrcode = () => {

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
    <>
      {connected ? (
        <h1 className='font-bold text-2xl'>Conectado!</h1>
      ) : !loading.status && !qrcode ? (
        <h1 className='font-bold text-2xl'>Desconectado</h1>
      ) : (
        <>
          <QRCodeCanvas size={!qrcode ? 0 : 256} value={qrcode} data-loading={loading.status} className='transition-opacity delay-300 opacity-0 invisible data-[loading="false"]:opacity-100 data-[loading="false"]:visible' />
          <div data-loading={loading.status} className='data-[loading="false"]:opacity-0 data-[loading="false"]:h-0 animate-spin rounded-full h-32 w-32 border-b-2'></div>
          {loading.message && (
            <>
              <progress id="whatsapp-percent" className="h-3 " max={100} value={loading.percent}></progress>
              <p>{loading.message} - {loading.percent}%</p>
            </>
          )}
        </>
      )}
    </>
  );
}
