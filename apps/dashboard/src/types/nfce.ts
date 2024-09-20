export interface NFCeType {
  natureza_operacao: string
  data_emissao: string
  presenca_comprador: string
  cnpj_emitente: string
  modalidade_frete: string
  local_destino: string
  items: NFCeItemType[]
  formas_pagamento: NFCeFormsPaymentType[]
}

export interface NFCeItemType {
  numero_item: string
  codigo_ncm: string
  codigo_produto: string
  descricao: string
  quantidade_comercial: string
  quantidade_tributavel: string
  cfop: string
  valor_unitario_comercial: string
  valor_unitario_tributavel: string
  valor_bruto: string
  unidade_comercial: string
  unidade_tributavel: string
  icms_origem: string
  icms_situacao_tributaria: string
}

export interface NFCeFormsPaymentType {
  forma_pagamento: string
  valor_pagamento: string
  // numero_autorizacao: string
  // nome_credenciadora: string
  bandeira_operadora?: string
}

export interface Ncm {
  codigo: string
  descricao_completa: string
  capitulo: string
  posicao: string
  subposicao1: string
  subposicao2: string
  item1: string
  item2: string
}

export enum NFCeFormsPaymentEnum {
  money = '01',
  credit = '03',
  debit = '04',
  cashback = '05',
  food = '10',
  snack = '11',
  pix = '99',
  picpay = '99',
}
