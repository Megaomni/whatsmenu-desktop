//Adonis WS types;
declare module 'adonis-websocket-client'
declare module '@adonisjs/websocket-client'
declare var adonis: any
globalThis.adonis = {}

declare module '*.mp3' {
  const src: string
  export default src
}

declare module '@pagarme/pagarme-nodejs-sdk' {
  export namespace client {
    function connect(authentication: {
      api_key: string
    }): Promise<typeof client>

    function search(opts: any, query: any): any

    function status(opts: any): any

    function versions(opts: any): any

    namespace acquirers {
      function all(opts: any, pagination: any): any

      function create(opts: any, body: any): any

      function find(opts: any, body: any): any

      function findAll(a0: any, a1: any, ...args: any[]): any

      function update(opts: any, body: any): any
    }

    namespace acquirersConfigurations {
      function all(opts: any, pagination: any): any

      function create(opts: any, body: any): any

      function find(opts: any, body: any): any

      function findAll(a0: any, a1: any, ...args: any[]): any

      function update(opts: any, body: any): any
    }

    namespace antifraudAnalyses {
      function create(opts: any, body: any): any

      function find(opts: any, body: any): any
    }

    namespace balance {
      function find(opts: BalanceFindInput): Promise<BalanceObject>

      function primary(opts: any): any
    }

    namespace balanceOperations {
      function all(arg: FindAllBalanceOperations): Promise<BalanceOperation>

      function days(opts: any, body: any): any

      function find(opts: any, body: any): any
    }

    namespace bankAccounts {
      function all(opts: any, body: any): any

      function create(opts: CreateContaBancaria): Promise<ContaBancaria>

      function find(opts: any): Promise<ContaBancaria>
    }

    namespace bulkAnticipations {
      function all(opts: any, body: any): any

      function cancel(opts: any, body: any): any

      function confirm(opts: any, body: any): any

      function create(opts: any, body: any): any

      function days(opts: any, body: any): any

      function destroy(opts: any, body: any): any

      function find(opts: any, body: any): any

      function limits(opts: any, body: any): any

      function update(opts: any, body: any): any
    }

    namespace cards {
      function all(opts: any, pagination: any): any

      function create(opts: any, body: any): any

      function find(opts: any, body: any): any
    }

    namespace chargebackOperations {
      function find(a0: any, a1: any, ...args: any[]): any
    }

    namespace chargebacks {
      function find(opts: any, query: any): any
    }

    namespace company {
      function activate(opts: any): any

      function affiliationProgress(opts: any): any

      function create(opts: any, body: any): any

      function createTemporary(opts: any, body: any): any

      function current(opts: any): any

      function resetKeys(opts: any): any

      function update(opts: any, body: any): any

      function updateBranding(opts: any, body: any): any

      namespace emailTemplates {
        function find(opts: any, body: any): any

        function update(opts: any, body: any): any
      }
    }

    namespace customers {
      function all(opts: any, body: any): any

      function create(opts: any, body: any): any

      function find(opts: any, body: any): any
    }

    namespace events {
      function find(opts: any, body: any): any

      function findCustom(opts: any, body: any): any
    }

    namespace gatewayOperations {
      function find(opts: any, body: any): any

      function refuseMessage(opts: any, body: any): any
    }

    namespace invites {
      function all(opts: any): any

      function create(opts: any, body: any): any

      function destroy(opts: any, body: any): any

      function find(opts: any, ...args: any[]): any
    }

    namespace orders {
      function all(opts: any, body: any): any
    }

    namespace payables {
      function all(args: FindRecebiveisArgs): Promise<Recebivel[]>

      function days(opts: any, body: any): any

      function find(opts: FindRecebivelArg): Promise<Recebivel[]>
    }

    namespace paymentLinks {
      function all(opts: any, body: any): any

      function cancel(opts: any, body: any): any

      function create(opts: any, body: any): any

      function find(opts: any, body: any): any
    }

    namespace plans {
      function all(opts: any, pagination: any): any

      function create(opts: any, body: any): any

      function find(opts: any, body: any): any

      function findAll(a0: any, a1: any, ...args: any[]): any

      function update(opts: any, body: any): any
    }

    namespace postbacks {
      function find(opts: any, body: any): any

      function redeliver(opts: any, body: any): any
    }

    namespace recipients {
      function all(opts: any, body: any): any

      function create(opts: CreateRecebedor): Promise<Recebedor>

      function find(opts: any): any

      function update(opts: UpdateRecebedor): Promise<Recebedor>
    }

    namespace reprocessedTransactions {
      function find(opts: any, query: any): any
    }

    namespace security {
      function encrypt(opts: any, card: any): any

      function sign(opts: any, string: any): any

      function verify(opts: any, string: any, expected: any): any
    }

    namespace session {
      function create(opts: any, email: any, password: any): any

      function destroy(opts: any, id: any): any

      function verify(opts: any, payload: any): any
    }

    namespace splitRules {
      function find(opts: any, body: any): any
    }

    namespace subscriptions {
      function all(opts: any, body: any): any

      function cancel(opts: any, body: any): any

      function create(opts: any, body: any): any

      function createTransaction(opts: any, body: any): any

      function find(opts: any, body: any): any

      function findAll(a0: any, a1: any, ...args: any[]): any

      function findTransactions(opts: any, body: any): any

      function settleCharge(opts: any, body: any): any

      function update(opts: any, body: any): any
    }

    namespace transactions {
      function all(opts: any, body: any): any

      function calculateInstallmentsAmount(opts: any, body: any): any

      function capture(opts: CaptureArgs): Promise<TransacaoObject>

      function cardHashKey(opts: any): any

      function collectPayment(opts: any, body: any): any

      function create(opts: CreateTransacaoInput): Promise<TransacaoObject>

      function find(opts: any, body: any): any

      function refund(args: EstornoArgs): Promise<TransacaoObject>

      function reprocess(opts: any, body: any): any

      function update(opts: any, body: any): any
    }

    namespace transfers {
      function all(args: FindAllTransfersArgs): Promise<TransferenciaObject[]>

      function cancel(opts: any, body: any): any

      function create(opts: TransferenciaInput): Promise<TransferenciaObject>

      function days(opts: any): any

      function find(opts: any, body: any): any

      function limits(opts: any, params: any): any
    }

    namespace user {
      function all(opts: any, body: any): any

      function create(opts: any, body: any): any

      function current(opts: any): any

      function destroy(opts: any, body: any): any

      function find(opts: any, body: any): any

      function redefinePassword(opts: any, body: any): any

      function resetPassword(opts: any, body: any): any

      function update(opts: any, body: any): any

      function updatePassword(opts: any, body: any): any
    }

    namespace zipcodes {
      function find(a0: any, a1: any, ...args: any[]): any
    }
  }

  // TO GERANDO

  export interface Authentication {
    api_key: string
  }

  export interface Document {
    type: string
    number: string
  }

  export interface CustomerInput {
    id?: string
    external_id: string
    name: string
    type: string
    country: string
    email: string
    documents: Document[]
    phone_numbers: string[]
    birthday: string
  }

  export interface Address {
    country: string
    state: string
    city: string
    neighborhood?: string
    street: string
    street_number: string
    zipcode: string
    complementary?: string
  }

  export interface BillingInput {
    name: string
    address: Address
  }

  export interface Address2 {
    country: string
    state: string
    city: string
    neighborhood: string
    street: string
    street_number: string
    zipcode: string
  }

  export interface ShippingInput {
    name: string
    fee: number
    delivery_date: string
    expedited: boolean
    address: Address2
  }

  export interface ItemInput {
    id: string
    title: string
    unit_price: number
    quantity: number
    tangible: boolean
    category?: string
    venue?: string
    date?: string
  }

  export interface CreateTransacaoInput {
    amount: number
    card_hash: string
    async?: boolean
    soft_descriptor?: string
    installments?: string
    customer: CustomerInput
    capture: boolean
    billing: BillingInput
    shipping?: ShippingInput
    items: ItemInput[]
  }

  // CONTA BANCARIA

  export interface CreateContaBancaria {
    agencia: string
    agencia_dv?: string
    bank_code: string
    conta: string
    conta_dv: string
    document_number: string
    legal_name: string
  }

  export interface ContaBancaria {
    object: string
    id: number
    bank_code: string
    agencia: string
    agencia_dv: string
    conta: string
    conta_dv: string
    type: string
    document_type: string
    document_number: string
    legal_name: string
    charge_transfer_fees: boolean
    date_created: Date
  }

  export interface PhoneNumber {
    ddd: string
    number: string
    type: string
  }

  export interface RegisterInformationInput {
    type: 'individual'
    document_number: string
    name: string
    site_url?: string
    email: string
    phone_numbers?: PhoneNumber[]
  }

  export interface CreateRecebedor {
    transfer_interval: string
    transfer_day: string
    transfer_enabled: boolean
    bank_account_id?: string
    anticipatable_volume_percentage?: string
    automatic_anticipation_enabled?: string
    postback_url?: string
    register_information?: RegisterInformationInput
  }
  type UpdateRecebedor = {
    recipient_id: string
  } & Partial<CreateRecebedor>

  export interface BankAccount {
    object: string
    id: number
    bank_code: string
    agencia: string
    agencia_dv?: any
    conta: string
    conta_dv: string
    type: string
    document_type: string
    document_number: string
    legal_name: string
    charge_transfer_fees: boolean
    date_created: Date
  }

  interface SplitRuleArg {
    liable: boolean
    charge_processing_fee: boolean
    amount: number
    recipient_id: string
  }

  export interface Recebedor {
    object: string
    id: string
    transfer_enabled: boolean
    last_transfer?: any
    transfer_interval: string
    transfer_day: number
    automatic_anticipation_enabled: boolean
    anticipatable_volume_percentage: number
    date_created: Date
    date_updated: Date
    postback_url: string
    status: string
    status_reason?: any
    metadata?: any
    bank_account: BankAccount
  }

  interface CaptureArgs {
    id: string
    amount: number
    split_rules?: SplitRuleArg[]
  }

  interface TransacaoObject {
    object: 'transaction'
    status:
      | 'processing'
      | 'authorized'
      | 'paid'
      | 'refunded'
      | 'waiting_payment'
      | 'pending_refund'
      | 'refused'
    refuse_reason?:
      | 'acquirer'
      | 'antifraud'
      | 'internal_error'
      | 'no_acquirer'
      | 'acquirer_timeout'
    date_created: string
    authorized_amount: string | number
    id: number | string
    cost: number | string
    reference_key: string
  }

  interface Recebivel {
    object: 'payable'
    id: number | string
    status: 'waiting_funds' | 'prepaid' | 'paid' | 'suspended'
    amount: string
    fee: string
    anticipation_fee?: number | string
    installment: number | string
    transaction_id: number | string
    split_rule_id: string
    bulk_anticipation_id?: string
    recipient_id: string
    payment_date: string
    original_payment_date: string
    type:
      | 'credit'
      | 'refund'
      | 'refund_reversal'
      | 'chargeback'
      | 'chargeback_refund'
      | 'block'
      | 'unblock'
    payment_method: 'credit_card' | 'debit_card' | 'boleto'
    accrual_date: string
    date_created: string
  }

  interface FindRecebivelArg {
    transaction_id: string
  }

  interface FindRecebiveisArgs {
    createdAt?: string
    amount?: string
    recipient_id?: string
    status?: 'paid' | 'waiting_funds'
    installment?: string
    transaction_id?: string
    payment_date?: string
    type?: 'chargeback' | 'refund' | 'chargeback_refund' | 'credit'
    id?: string
    count: number
    page: number
  }

  interface TransferenciaInput {
    amount: string
    recipientId: string
    metaData?: JSON
  }

  interface TransferenciaObject {
    object: 'transfer'
    Id: number | string
    Amount: number | string
    Type: 'ted' | 'doc' | 'credito_em_conta'
    Status:
      | 'pending_transfer'
      | 'transferred'
      | 'failed'
      | 'processing'
      | 'canceled'
    Fee: number | string
    Funding_date: string
    Funding_estimated_date: string
    transaction_id: number | string
    Bank_account: ContaBancaria
    Date_created: string
    metadata: JSON
  }

  interface FindAllTransfersArgs {
    count: number
    page: number
    bank_account_id?: string
    amount?: string
    recipient_id?: string
    id?: string
    date_created?: string
    created_at?: string
  }

  interface BalanceFindInput {
    recipientId: string
  }

  interface BalanceObject {
    object: 'balance'
    waiting_funds: { amount: number | string }
    available: { amount: number | string }
    transferred: { amount: number | string }
  }

  interface BalanceOperation {
    Object: 'balance_operation'
    id: string
    status: 'waiting_funds' | 'available' | 'transferred'
    balance_amount: number
    type: 'payable' | 'anticipation' | 'transfer'
    amount: number
    fee: number
    date_created: string
    movement_object: TransferenciaObject | Recebivel
  }

  interface FindAllBalanceOperations {
    count: number
    page: number
    status?: 'waiting_funds' | 'available' | 'transferred'
    start_date?: number
    end_date?: number
  }

  interface EstornoArgs {
    id: number
  }
}
