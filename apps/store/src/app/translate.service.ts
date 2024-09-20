import { HttpClient } from '@angular/common/http'
import { DEFAULT_CURRENCY_CODE, Injectable, LOCALE_ID } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class TranslateService {
  private translate: TranslateType | null = null

  constructor(private httpClient: HttpClient) {
    this.setLanguage(localStorage.getItem('lang') || 'pt-BR')
      .then((data: TranslateType) => {
        console.log('Língua Carregada com Sucesso: ' + data.language)
        ;[
          {
            provide: LOCALE_ID,
            useValue: data.language,
          },
          {
            provide: DEFAULT_CURRENCY_CODE,
            useValue: data.currency,
          },
        ]
      })
      .catch((e) => {
        console.error('Língua Não Carregada')
        console.log(e)
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
          this.translate = data
          resolve(data)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  public text() {
    return this.translate.text
  }

  public alert() {
    return this.translate.alert
  }

  public masks() {
    return this.translate?.masks
  }

  public shouldShowLocale() {
    return this.translate?.language === 'pt-BR' || this.translate?.showLocale === true
  }

  public language() {
    return this.translate.language
  }

  public currency() {
    return this.translate.currency
  }

  public country_code() {
    return this.translate.country_code
  }

  public calendar() {
    return this.translate.calendar
  }
}

export interface TranslateType {
  language: string
  currency: string
  country_code: string
  showLocale: boolean
  masks: {
    locale: string[]
    phone: string
    cell: string
    secret_number: string
    ssn_mask: string
    date_mask: string
    date_mask_format_m: string
    mi: string
    zipcode: string
    date_mask_two: string
  }
  text: {
    coin: string
    add_to_order: string
    enter_street_name: string
    place_example: string
    phone_footer: string
    select_neighborhood: string
    enter_neighborhood: string
    select_city: string
    enter_city: string
    notice: string
    items_found: string
    no_product_found: string
    favorite_card_comment: string
    finalize_order_comment: string
    welcome: string
    hello: string
    goodbye: string
    opened: string
    closed: string
    optional: string
    add: string
    obs: string
    my_orders: string
    tax_and_time_of_shipping: string
    delivery: string
    scheduling: string
    scheduling2: string
    package: string
    close_order: string
    cart: string
    verify: string
    add_more_items: string
    next: string
    items: string
    disc: string
    what_your_name: string
    open_new_order: string
    enter_name_your_order: string
    select_order: string
    addition: string
    price: string
    edit_item: string
    remove: string
    shipping: string
    select_shipoing: string
    edit: string
    local_pickup: string
    take_out: string
    cupom: string
    active_your_cupom: string
    code_of_cupom: string
    total: string
    select_the_form_of_shipping: string
    obrigatory: string
    go_to_payment: string
    payment: string
    pay_on_app: string
    pay_on_shippingg: string
    my_cards: string
    money: string
    credit: string
    debit: string
    snack: string
    food: string
    pix: string
    picpay: string
    discont: string
    payment_in: string
    i_need_transhipment: string
    i_not_need_transhipment: string
    secret_number_on_note: string
    search_products_by_name_or_description: string
    print: string
    zip_invalid: string
    coupon_only_used_purchases: string
    discount_coupon_greater_total: string
    new_order: string
    number_comment: string
    add_on: string
    error_generating_qrcode: string
    payment_not_detected_check_banking: string
    error_processing_payment: string
    error_creating_customer: string
    outside_the_coverage_area: string
    unavilable: string
    product_unavilable: string
    unavilable_amount: string
    no_categories_available_at_moment: string
    check_admin_panel_categories_active: string
    cart_empty: string
    table: string
    discont_of: string
    activated: string
    free_freight: string
    free: string
    add_address: string
    covered_address: string
    send_order: string
    you_are_blocked: string
    enter_your_name: string
    enter_your_cell: string
    enter_your_email: string
    enter_your_address: string
    enter_you_ddd: string
    minimum_unconceived_value: string
    finish_payment_pix: string
    finish_payment: string
    payment_online: string
    payment_offline: string
    cashback: string
    credit_card: string
    add_new_card: string
    pay_on_delivery: string
    i_need_change_for: string
    i_dont_need_change: string
    send_there_receipt: string
    copy_key: string
    select_the_flag: string
    select: string
    cpf_on_the_receipt: string
    how_to_pay_with_pix: string
    enter_cpf_generate_pix: string
    enter_a_valid_cpf: string
    order_pending_payment: string
    generate_pix_key: string
    pix_copy_paste: string
    copy_code: string
    pix_key_expired: string
    paste_this_code_your_bank: string
    verify_pix_payment: string
    card_details: string
    name_on_the_card: string
    card_number: string
    expiry: string
    card_nickname: string
    billing_adress: string
    zip_code: string
    adress_line_2: string
    order_will_be_delivered: string
    to_consult: string
    minutes: string
    flavors: string
    crust: string
    general_toppings: string
    single_crust: string
    message_cvv_payment: string
    code_back_of_your_card: string
    complete_payment: string
    delete: string
    what_card_nickname: string
    save: string
    use_cashback: string
    balance: string
    indentify_yourself: string
    whatsapp_number: string
    name: string
    date_of_birth: string
    place_order_necessary_information: string
    order_slip: string
    no_active_orders: string
    order_sucess: string
    send_confirmation_whatsapp: string
    select_delivery_date: string
    time_zone_is_different: string
    delivery_time_between: string
    delivery_time_for_order: string
    establishment_notes: string
    no_more_avaible_slots_for_orders: string
    contact_establishment: string
    no_slots_avaible_for_orders_on_that_day: string
    please_select_another_date: string
    continue: string
    last_orders: string
    date: string
    view_order: string
    edit_addresses: string
    address: string
    add_new_addresses: string
    create_address_or_use_list_below: string
    more_information: string
    notification_permissions: string
    opening_hours: string
    from: string
    to: string
    pay_online: string
    choose_this_option_secure_payment: string
    choose_option_receiving: string
    acess_your_payment_app: string
    qrcode_copy_paste_payment: string
    pay_credited_instantly: string
    enter_your_cpf: string
    payment_still_pending: string
    confirmation_is_taking_too_long: string
    use_delivery_address: string
    city: string
    state: string
    payment_method: string
    required: string
    cash_payment: string
    payment_debit_card: string
    payment_credit_card: string
    card_network: string
    payment_meal_voucher: string
    payment_food_voucher: string
    receipt_to_our_whatsapp: string
    total_to_transfer: string
    type_of_key: string
    save_future_purchases: string
    finalize_order: string
    add_ons: string
    choose_single_crust: string
    crust_without_filling: string
    choose_the: string
    attention: string
    complete_order_mandotory: string
    no_orders_moment: string
    fees: string
    delivery_fee: string
    calculate: string
    pickup_only: string
    loading_dates: string
    choose_date: string
    see_full_list: string
    no_products_found: string
    size_unavilable: string
    edit_notes: string
    remove_item: string
    point_camera_qrcode: string
    order_status: string
    order: string
    in_preparation: string
    canceled: string
    order_received: string
    pending_payment: string
    order_approved: string
    order_preparation: string
    order_canceled: string
    order_out_for_delivery: string
    order_ready_for_pickup: string
    send_order_whatsapp: string
    coupon: string
    reference_point: string
    house_corner: string
    neighborhood: string
    address_complement: string
    number: string
    block_apt: string
    ave: string
    date_usa: string
    choose_time: string
    minimum_quantity: string
    maximum_quantity: string
    user: string
    cancel: string
    repeat_order: string
    activate: string
    pick_up_counter: string
    counter_and_delivery: string
    discount_of: string
    applied: string
    addresses: string
    change_address: string
    summary: string
    message_no_costumer_selected: string
    search_customer: string
    add_customer: string
    proceed: string
    outside_service_area: string
    free_comment: string
    free_freight_comment: string
    activate_coupon_comment: string
    order_type: string
    place_order: string
    open_register: string
    initial_balance: string
    income: string
    cash_register_status: string
    cash_outflow: string
    value: string
    description: string
    code: string
    close_cash_register: string
    initial_balance_n: string
    cash_balance: string
    final_balance: string
    counter: string
    create_order_slip: string
    order_slip_s: string
    change_tables: string
    print_table: string
    close_table: string
    phone: string
    client: string
    no_registred_address: string
    change_table: string
    cancel_order: string
    cash_outflows: string
    cashier_balance: string
    charge: string
    qty: string
    standard: string
    search_name_comment: string
    search_flavor_comment: string
    avaible: string
    occupied: string
    paused: string
    waiting_service: string
    table_s: string
    pause_comment: string
    unpause_comment: string
    order_buy: string
    clear: string
    order_the_table: string
    registration_comment: string
    change_comment: string
    one_more_comment: string
    customer: string
    customer_name_comment: string
    email_example_comment: string
    ssn: string
    ssn_model_comment: string
    number_model_comment: string
    close: string
    client_comment: string
    order_by: string
    delivery_address: string
    no_number: string
    dont_know_my_zip: string
    other_s: string
    deliver_this_address: string
    delivery_date: string
    out_coverage_area: string
    technology: string
    finalize_appointment: string
    next_confirm: string
    shortcuts: string
    return_cancel: string
    return: string
    paid: string
    remaining: string
    add_comment: string
    discount_comment: string
    fee_comment: string
    type: string
    fee_discount: string
    how_pay_pix: string
    step: string
    enter_cpf: string
    payment_deadline: string
    select_comment: string
    call_back_house: string
    table_change: string
    change_for: string
    for: string
    out_for_delivery: string
    waiting_for_pickup: string
    add_flavor: string
    none: string
    flavor: string
    choose_the_o: string
    your_flavor: string
    choose: string
    selected_date_is_earlier: string
    from_de: string
    complete: string
    register_closing: string
    confirm_register_closing: string
    closing_insert_following: string
    register_login: string
    password: string
    deposit: string
    purpose: string
    list: string
    new: string
    make_payment: string
    products: string
    uncancel_order: string
    order_amount: string
    print_the: string
    change: string
    free_comment_up: string
    choose_single_crust_comment: string
    choose_crust_comment: string
    next_flavor_comment: string
    choose_flavor_comment: string
    quantity_unavaible: string
    complete_toppings_comment: string
    out_stock_toppings_comment: string
    in_stock_comment: string
    flavors_comment: string
    flavor_comment: string
    the_flavors_comment: string
    the_crust_comment: string
    the_toppings_comment: string
    mandatory_to_choose: string
    time_closed_comment: string
    my_name_is: string
    contact: string
    order_code: string
    no_time_up: string
    with: string
    observations: string
    coupon_used: string
    fee_shipping_up: string
    consult: string
    link_for_order_status: string
    chosen_date_earlier_current_date: string
    check_the_cvv: string
    check_card_details: string
    check_billing_address: string
    check_card_expiration_date: string
    check_card_number: string
    check_security_code: string
    check_zip_code: string
    unable_register_your_order_try_again: string
    system_identified_you_are_outside: string
    fee: string
    select_the_flag_comment: string
    change_less_purchase_comment: string
    free_shipping_comment: string
    consult_comment: string
    location_comment: string
    payment_in_comment: string
    paid_online_comment: string
    change_for_comment: string
    track_order: string
    street: string
    reference: string
    pickup_the_location: string
    unable_create_customer: string
    zip_code_not_found: string
    order_comment: string
    schedule: string
    closed_orders: string
    scheduling_closed: string
    package_s: string
    order_name: string
    mandatory_items: string
    minimum: string
    advance: string
    card: string
    add_another_card: string
    loading_page: string
  }
  alert: {
    unable_to_read: string
    address_covarage_area: string
    register_open_24: string
    table_desactived: string
    moment_table_not_avaible: string
    table_not_avaible_new_orders: string
    order_already_been_completed: string
    at_the_table: string
    deliver_order: string
    not_belong_this_table: string
    store_closed: string
    not_minimum_value: string
    failed_validate_coupon: string
    amount_not_include_delivery_fee: string
    coupon_used_starting_from: string
    closed_delivery: string
    selected_date_earlier_choose_later_date: string
    try_again_moment: string
    error_generate_qrcode: string
    payment_not_detected: string
    reloaded_page_message: string
    name_and_phone_required: string
    enter_your_details: string
    enter_your_whatsapp: string
    enter_your_date_of_birth: string
    review_change_amount: string
    no_internet_connection: string
  }
  calendar: {
    weekdays: string[]
    months: string[]
  }
}
