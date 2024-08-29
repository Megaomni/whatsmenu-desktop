/**
 * Serializes an object to JSON if it is a string, otherwise returns the object as is.
 *
 * @param {any} obj - The object to be serialized.
 * @return {any} - The serialized object as a JSON string or the original object.
 */
export const jsonSerialize = (obj: any): any => {
  if (typeof obj === 'string') {
    return JSON.parse(obj)
  }

  return obj
}
