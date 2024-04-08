import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { WhatsAppBotApi } from '../preload';

interface ElectronWindow extends Window {
  WhatsAppBotApi: typeof WhatsAppBotApi
}

declare const window: ElectronWindow

export const Qrcode = () => {

  const [qrcode, setQrcode] = useState('');
  
  useEffect(() => {
    window.WhatsAppBotApi.onqrcode((_ ,qr: string) => {
      setQrcode(qr)
    })
  }, [])

  return (
    <>
      <QRCodeCanvas size={!qrcode ? 0 : 128} value={qrcode} data-loading={!qrcode} className='transition-opacity delay-300 opacity-0 invisible data-[loading="false"]:opacity-100 data-[loading="false"]:visible' />
      <div data-loading={!qrcode} className='data-[loading="false"]:opacity-0 data-[loading="false"]:h-0 animate-spin rounded-full h-32 w-32 border-b-2'></div>
    </>
  );
}
