/** Retorna moeda formatada, se passar symbol como true retorna somente o symbolo da moeda. Ex: (value: 0, symbol: true) => R$ , se passar withOutymbol como true retorna somente o valor sem simbolo. Ex: (value: 10, symbol: false, withOut: true) => 10,00 */
export const currency = ({
    value = 0,
    symbol = false,
    withoutSymbol = false,
    language = 'pt-BR',
    currency = 'BRL',
  }: {
    value: number
    symbol?: boolean
    withoutSymbol?: boolean
    language?: string
    currency?: string
  }) => {
    if (!value || isNaN(value)) {
      value = 0
    }
  
    value = value && parseFloat(value.toString())
    if (symbol) {
      return (0)
        .toLocaleString(language, {
          style: 'currency',
          currency,
        })
        .replace(/\d+(,|\.)\d+/, '')
    }
  
    if (withoutSymbol) {
      return new Intl.NumberFormat(language, {
        style: 'currency',
        currency,
      })
        .format(value)
        .replace(/\D+/, '')
    }
  
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
    }).format(value)
  }