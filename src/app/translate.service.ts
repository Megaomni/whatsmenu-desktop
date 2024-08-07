import { HttpClient } from '@angular/common/http';
import { DEFAULT_CURRENCY_CODE, Injectable, LOCALE_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
 private translate: TranslateType | null = null;
  constructor(private httpClient: HttpClient) { 
    this.setLanguage(localStorage.getItem('lang') || 'pt-BR').then((data: TranslateType) => {
      console.log('Língua Carregada com Sucesso');
      [
        {
          provide: LOCALE_ID,
          useValue: data.language
        },
        {
          provide: DEFAULT_CURRENCY_CODE,
          useValue: data.currency
        },
      ]
      
    }).catch((e) => {
      console.error('Língua Não Carregada');
      console.log(e);
      
    })
   }

  /**
   * Set the language for translation.
   *
   * @param {string} lang - the language code to set
   */
  private setLanguage(lang: string) {
    return new Promise((resolve, reject) => {
      try {
        this.httpClient.get(`./assets2/lang/${lang}.json`).subscribe((data: TranslateType) => {
          this.translate = data;
          resolve(data)
        });
      } catch (error) {
        reject(error)
      }
    });
    
  }

  public text() {
    return this.translate.text;
  }

  public mascks() {
    return this.translate.mascks;
  }

  public language() {
    return this.translate.language;
  }

  public currency() {
    return this.translate.currency;
  }

  public country_code() {
    return this.translate.country_code;
  }

}

export interface TranslateType {
  language: string,
  currency: string,
  country_code: string,
  mascks: {
      phone: string,
      cell: string,
      secret_number: string
  },
  text: {
      welcome: string,
      hello: string,
      goodbye: string,
      opened: string,
      closed: string,
      optional: string,
      add: string,
      obs: string,
      my_orders: string,
      tax_and_time_of_shipping: string,
      delivery: string,
      scheduling: string,
      scheduling2: string,
      package: string,
      close_order: string,
      cart: string,
      verify: string,
      add_more_items: string,
      next: string,
      items: string,
      price: string,
      edit_item: string,
      remove: string,
      shipping: string,
      select_shipoing: string,
      edit: string,
      take_out: string,
      cupom: string,
      active_your_cupom: string,
      code_of_cupom: string,
      total: string,
      select_the_form_of_shipping: string,
      obrigatory: string,
      go_to_payment: string,
      payment: string,
      pay_on_app: string,
      pay_on_shippingg: string,
      my_cards: string,
      money: string,
      credit: string,
      debit: string,
      discont: string,
      paymento_in: string,
      i_need_transhipment: string,
      i_not_need_transhipment: string,
      secret_number_on_note: string,
      search_products_by_name_or_description: string,
      outside_the_coverage_area: string,
      unavilable: string,
      product_unavilable: string,
      unavilable_amount: string,
      table: string,
      discont_of: string,
      activated: string,
      free_freight: string,
      free: string,
      add_address: string,
      covered_address: string,
      send_order: string,
      you_are_blocked: string,
      enter_your_name: string,
      enter_your_cell: string,
      enter_your_email: string,
      enter_your_address: string,
      enter_you_ddd: string,
      minimum_unconceived_value: string,
      finish_payment_pix: string,
      finish_payment: string,
      payment_online: string,
      payment_offline: string,
      cashback: string,
  }
}
