/**
 * Serializa um objeto para JSON se for uma string, caso contrário retorna o objeto como está.
 *
 * @param {any} obj - O objeto a ser serializado.
 * @return {any} - O objeto serializado como uma string JSON ou o objeto original.
 */
export const jsonSerialize = (obj: any): any => {
  if (typeof obj === 'string') {
    return JSON.parse(obj)
  }

  return obj
}
