export const convertToFocusNfce({profile, cart, user}): NFCeType {
    return {
        natureza_operacao: 'VENDA AO CONSUMIDOR',
        data_emissao: DateTime.local().toISO(),
        presenca_comprador: cart.address ? '4' : '1',
      cnpj_emitente: user.secretNumber,
      indicador_inscricao_estadual_destinatario: '9',
      modalidade_frete: '9',
      local_destino: '1',
      items: cart.itens.map((item, index) => ({
        numero_item: String(index + 1),
        codigo_ncm: '00000000',
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
        valor_desconto: '0.00',
        icms_origem: '0',
        icms_situacao_tributaria: '102',
        // valor_total_tributos: '',
      })),
      formas_pagamento: this.formsPayment.map((formPayment) => {
        formPayment.payment
        return {
          forma_pagamento: NFCeFormsPaymentEnum[formPayment.payment],
        }
      }),
    }
    }
