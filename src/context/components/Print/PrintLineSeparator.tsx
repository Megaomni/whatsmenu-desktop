'use client'
import { useContext } from 'react'
import { PrintContext } from '../../print.context'
import { View } from '@react-pdf/renderer'

export const PrintLineSeparator = () => {
  const { paperWidthSize, printMode } = useContext(PrintContext)
  const separator = new Array(paperWidthSize).fill('_')
  return (
    <pre className={`lineseparator ${printMode}`}>
      {printMode !== 'pdf' ? separator.join('') + '\n' : <View style={{ border: '1px dashed black', height: 0 }} />}
    </pre>
  )
}
