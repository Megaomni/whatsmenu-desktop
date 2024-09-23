import { NFCeFormsPaymentEnum, NFCeType } from '../types/nfce'
import { DateTime } from 'luxon'

/**
 * Converte um carrinho para um objeto NFC-e para uso com o banco de dados da Focus
 *
 * @param {object} cart - Carrinho de compras (Pedido)
 * @param {object} groveNfeCompany - Empresa que irá emitir a nota
 * @returns {NFCeType} - Objeto NFC-e
 */
export const convertToFocusNfce = ({
  cart,
  groveNfeCompany,
}: {
  cart: any
  groveNfeCompany: any
}): NFCeType => {
  return {
    natureza_operacao: 'VENDA AO CONSUMIDOR',
    data_emissao: DateTime.local().toISO(),
    presenca_comprador: cart.address ? '4' : '1',
    cnpj_emitente: groveNfeCompany.doc_number,
    modalidade_frete: '9',
    local_destino: '1',
    items: cart.itens.map((item: any, index: number) => ({
      numero_item: String(index + 1),
      codigo_ncm: item.details.ncm_code,
      codigo_produto: String(item.id),
      descricao: item.name,
      quantidade_comercial: String(item.quantity),
      quantidade_tributavel: String(item.quantity),
      cfop: '5102',
      valor_unitario_comercial: String(item.details.value),
      valor_unitario_tributavel: String(item.details.value),
      valor_bruto: String(item.details.value * item.quantity),
      unidade_comercial: 'un',
      unidade_tributavel: 'un',
      icms_origem: '0',
      icms_situacao_tributaria: '102',
      // valor_desconto: '0.00',
      // valor_total_tributos: '',
    })),
    formas_pagamento: cart.formsPayment.map((formPayment: any) => {
      formPayment.payment
      return {
        valor_pagamento: String(formPayment.value),
        forma_pagamento:
          NFCeFormsPaymentEnum[
            formPayment.payment as keyof typeof NFCeFormsPaymentEnum
          ],
        bandeira_operadora: formPayment.flag ? formPayment.flag : null,
      }
    }),
  }
}
