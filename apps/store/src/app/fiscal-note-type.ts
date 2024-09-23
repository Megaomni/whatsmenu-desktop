export interface FiscalNote {
  cnpj_emitent: string
  ref: string
  status: string
  status_sefaz: string
  mensagem_sefaz: string
  chave_nfe: string
  numero: string
  serie: string
  caminho_xml_nota_fiscal: string
  caminho_danfe: string
  qrcode_url: string
  url_consulta_nf: string
}
