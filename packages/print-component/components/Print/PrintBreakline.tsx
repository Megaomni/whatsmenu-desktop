import { useContext } from 'react'
import { PrintContext } from '../../PrintContext'

export const PrintBreakline = () => {
  const { printMode, appMode } = useContext(PrintContext)
  switch (printMode) {
    case 'formated':
    case 'pdf':
      return <br />
    case 'text-only':
      return <pre>{appMode ? '\n' : ' '}</pre>
  }
}
