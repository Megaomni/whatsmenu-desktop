// Função para extrair a versão do navegador
export const getBrowserVersion = () => {
  var version = ''
  if (/MSIE/i.test(navigator.userAgent)) {
    version = /MSIE\s([0-9.]+)/i.exec(navigator.userAgent)?.at(1) ?? ''
  } else if (/Firefox/i.test(navigator.userAgent)) {
    version = /Firefox\/([0-9.]+)/i.exec(navigator.userAgent)?.at(1) ?? ''
  } else if (/Chrome/i.test(navigator.userAgent)) {
    version = /Chrome\/([0-9.]+)/i.exec(navigator.userAgent)?.at(1) ?? ''
  } else if (/Safari/i.test(navigator.userAgent)) {
    version = /Version\/([0-9.]+)/i.exec(navigator.userAgent)?.at(1) ?? ''
  } else if (/Opera|OPR/i.test(navigator.userAgent)) {
    version = /(Opera|OPR)\/([0-9.]+)/i.exec(navigator.userAgent)?.at(2) ?? ''
  } else if (/Edge/i.test(navigator.userAgent)) {
    version = /Edge\/([0-9.]+)/i.exec(navigator.userAgent)?.at(1) ?? ''
  }
  return version
}
