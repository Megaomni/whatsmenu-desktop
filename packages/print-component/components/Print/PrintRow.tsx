import { HTMLAttributes, useContext } from 'react'
import { PrintContext } from '../../PrintContext'

export interface RowProps extends HTMLAttributes<HTMLPreElement> {
  left?: string
  center?: string
  right?: string
  leftClass?: string
  children_controls?: 'start' | 'mid' | 'end'
}

export const PrintRow = ({ left = '', center = '', right = '', leftClass = '', className, children_controls, ...rest }: RowProps) => {
  const { printMode, paperWidthSize, fontSize: printFontSize, paperSize } = useContext(PrintContext)
  let content
  const splitString = (text: string, limit: number) => {
    const regex = new RegExp(`.{1,${Math.max(1, limit)}}`, 'gmu')
    return Array.from(text?.match(regex) ?? [])
  }

  let text = ''

  const rowsObject: { [key: string]: string | string[] } = {
    left,
    center,
    right,
  }



  Object.entries(rowsObject).forEach(([key, value], index, arr) => {
    const lengths: { [key: string]: any } = {}
    let rowTextLength = 0
    if (index === 0) {
      arr.forEach(([k, str]) => {
        lengths[k] = { length: str?.length }
        rowTextLength += str?.length
      })
    }
    const result = value as string
    if (result?.length >= paperWidthSize) {
      rowsObject[key] = splitString(
        result,
        paperWidthSize -
        arr.reduce((total, [ak, as]) => {
          if (ak !== key) {
            total += as.length
          }
          return total
        }, 1)
      )
    } else if (rowTextLength > paperWidthSize) {
      rowsObject[key] = splitString(result, lengths[key].length - (rowTextLength + 1 - paperWidthSize) || 1)
    } else {
      rowsObject[key] = splitString(result, result?.length + 1 || 1)
    }
  })

  let rowsCount = 0
  const newRow: { [key: string]: string } = {}
  const rowsLength = Math.max(...Object.values(rowsObject).map((a) => a.length))
  Object.entries(rowsObject).forEach(([key, value]) => {
    while (value.length < rowsLength) {
      if (Array.isArray(value)) {
        value.push('')
      }
    }
    rowsObject[key] = value
    return rowsObject
  })
  while (rowsCount < rowsLength) {
    let rowCharLength = 0
    Object.entries(rowsObject).forEach(([key]) => {
      if (rowsObject[key] && rowsObject[key][rowsCount]) {
        newRow[key] = rowsObject[key][rowsCount] as string
        rowCharLength += (rowsObject[key][rowsCount] as string).length
      }
    })
    const blankSpaces = paperWidthSize - rowCharLength
    if (newRow.center?.length || children_controls === 'mid') {
      newRow.center = `${' '.repeat(blankSpaces / 2)}${newRow.center}${' '.repeat(blankSpaces / 2)}`
    } else {
      newRow.center = ' '.repeat(Math.max(blankSpaces, 0))
    }
    const newText = `${newRow.left}${newRow.center}${newRow.right}`
    text += newText
    rowsCount++
  }
  text = splitString(text, paperWidthSize).join('\n')
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  switch (printMode) {
    case 'text-only':
      content = <pre>{text}</pre>
      break
    case 'pdf':
    case 'formated':
      content = (
        <div style={{ fontWeight: 'bolder' }}>
          <p className={leftClass}>{children_controls === 'start' ? rest.children : left.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}</p>
          <p>{children_controls === 'mid' ? rest.children : center.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}</p>
          <p>{children_controls === 'end' ? rest.children : right?.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}</p>
        </div>
      )
      break
    // case 'pdf':
    //   let styles: { [ket: string]: any; 'complement-space'?: any; 'item-space'?: any } = {}
    //   switch (leftClass) {
    //     case 'complement-space':
    //       styles = StyleSheet.create({
    //         [leftClass]: {
    //           marginLeft: `${paperWidthSize === 32 ? 4 : 13}mm`,
    //         },
    //       })
    //       break
    //     case 'item-space':
    //       styles = StyleSheet.create({
    //         [leftClass]: {
    //           marginLeft: `${paperWidthSize === 32 ? 8 : 20}mm`,
    //         },
    //       })
    //       break
    //     default:
    //       break
    //   }

    //   const fontSize = className?.includes('print-title') ? '20pt' : printFontSize === 7 ? '14pt' : '18pt'
    //   const viewWidth = paperWidthSize === 32 ? 72 : 109

    //   content = (
    //     <View
    //       style={[
    //         {
    //           display: 'flex',
    //           justifyContent: 'space-between',
    //           flexDirection: 'row',
    //           width: `${viewWidth}mm`,
    //           fontSize,
    //           marginBottom: className?.includes('print-title') ? '24pt' : 0,
    //         },
    //         styles[leftClass],
    //       ]}
    //     >
    //       <Text wrap style={{ maxWidth: `${viewWidth - (printFontSize === 7 ? 18 : 15)}mm` }}>
    //         {left.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}
    //       </Text>
    //       <Text wrap style={{ textAlign: 'center', flex: 1 }}>
    //         {center.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}
    //       </Text>
    //       <Text style={{ textAlign: 'left', marginLeft: 'auto' }}>{right.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}</Text>
    //     </View>
    //   )
    //   break
  }

  return (
    <pre className={`print-row ${printMode} ${`layout-${paperSize}mm`} ${className ?? ''}`} {...rest}>
      {content}
    </pre>
  )
}
