import React, { ReactNode, createContext } from 'react'

export type PrintMode = 'formated' | 'text-only' | 'pdf'

interface PrintContextData {
  printMode: PrintMode
  paperWidthSize: number
  appMode?: boolean
  fontSize?: number
  paperSize?: 58 | 80
}

export interface PrintProviderProps {
  children: ReactNode
  printMode: PrintMode
  paperWidthSize: number
  paperSize?: 58 | 80
  appMode?: boolean
  fontSize?: number
}

export const PrintContext = createContext({} as PrintContextData)

export const PrintProvider = ({ children, paperWidthSize, printMode, appMode = false, fontSize, paperSize }: PrintProviderProps) => {
  return (
    <PrintContext.Provider
      value={{
        paperWidthSize,
        printMode,
        appMode,
        fontSize,
        paperSize,
      }}
    >
      {children}
    </PrintContext.Provider>
  )
}
