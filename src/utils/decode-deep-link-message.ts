export const decodeDeepLinkMessage = (dataUrl: string): {
  contact: string;
  message: string;
} => {
  const data = decodeURIComponent(dataUrl.replace('wmstatus://', ''))
  const contact = data.slice(data.indexOf('contact='), data.indexOf('&message=')).replace('contact=', '')
  let message = data.slice(data.indexOf('message=')).replace('message=', '')

  if (message[message.length - 1] === '/') {
    message = message.substring(-1, message.length - 1)
  }

  return { contact, message }
}