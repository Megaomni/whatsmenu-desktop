'use client'
import React, { LegacyRef, forwardRef } from 'react'
interface PrintRootProps extends PrintProviderProps {}
import { PrintProvider, PrintProviderProps } from '../../print.context'

export const PrintRoot = forwardRef(function PrintRoot(
  { children, paperWidthSize, printMode, fontSize, paperSize }: PrintRootProps,
  ref: LegacyRef<HTMLPreElement>
) {
  return (
    <PrintProvider
      paperWidthSize={paperWidthSize}
      printMode={printMode}
      fontSize={fontSize}
      paperSize={paperSize}
    >
      <pre className="print-root" ref={ref}>
        {children}
      </pre>
    </PrintProvider>
  )
})
