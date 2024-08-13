export const stringifyFunctions = (obj: any) => {
  const serializedObj: any = {}
  Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'function') {
      serializedObj[key] = value.toString()
    } else {
      serializedObj[key] = value
    }
  })
  return serializedObj
}

export const parseFunctions = (obj: any) => {
  const parsedObj: any = {}
  Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'string' && value.includes('function')) {
      parsedObj[key] = new Function(`return ${value}`)()
    } else {
      parsedObj[key] = value
    }
  })
  return parsedObj
}
