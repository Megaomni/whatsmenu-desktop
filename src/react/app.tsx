import React from 'react';
import { createRoot } from 'react-dom/client';
import { Qrcode } from './components/qrcode';

const root = createRoot(document.body);

root.render(
  <main className='flex flex-col items-center justify-center h-screen gap-4'>
    <h2 className='text-3xl mb-10'>Robô de atendimento - WhatsMenu</h2>
    <Qrcode />
  </main>
);