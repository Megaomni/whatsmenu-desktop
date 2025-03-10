import React from 'react'
import { createRoot } from 'react-dom/client'
import PrintProvider from './contexts/PrintProvider'
import MainPrintConfig from './components/mainPrintConfig'


const root = createRoot(document.body);

const PrintEnvironmentForm = () => {
  if (typeof window === 'undefined') return null;

  return (
    <PrintProvider>
      <MainPrintConfig />
    </PrintProvider>
  )
}

root.render(<PrintEnvironmentForm />);