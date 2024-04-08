import React from 'react';
import { createRoot } from 'react-dom/client';
import { Qrcode } from './components/qrcode';

const root = createRoot(document.body);



root.render(
  <main className='flex flex-col items-center justify-center h-screen gap-4'>
    <Qrcode />
    <h2 className='text-3xl '>WhatsMenu bot</h2>
  </main>
);