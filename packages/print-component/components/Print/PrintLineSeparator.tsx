import React, { useContext } from 'react'
import { PrintContext } from '../../PrintContext'

export const PrintLineSeparator: React.FC<any> = () => {
  const { paperWidthSize, printMode } = useContext(PrintContext)
  const separator = new Array(paperWidthSize).fill('_')
  return (
    <pre className={`lineseparator ${printMode}`}>
      {separator.join('') + '\n' }
    </pre>
  )
}
