export interface NFCeType {
    cnpj_emitente: string
    data_emissao: string
    indicador_inscricao_estadual_destinatario: string
    modalidade_frete: string
    local_destino: string
    presenca_comprador: string
    natureza_operacao: string
    items: NFCeItemType[]
    formas_pagamento: NFCeFormsPaymentType[]
  }
  
  export interface NFCeItemType {
    numero_item: string
    codigo_ncm: string
    quantidade_comercial: string
    quantidade_tributavel: string
    cfop: string
    valor_unitario_tributavel: string
    valor_unitario_comercial: string
    valor_desconto: string
    descricao: string
    codigo_produto: string
    icms_origem: string
    icms_situacao_tributaria: string
    unidade_comercial: string
    unidade_tributavel: string
    // valor_total_tributos: string
  }
  
  export interface NFCeFormsPaymentType {
    forma_pagamento: string
    valor_pagamento: string
    nome_credenciadora: string
    bandeira_operadora: string
    numero_autorizacao: string
  }
  
  export enum NFCeFormsPaymentEnum {
    money = '01',
    credit = '03',
    debit = '04',
    cashback = '05',
    food = '10',
    snack = '11',
    pix = '99',
    picpay = '99'
  }