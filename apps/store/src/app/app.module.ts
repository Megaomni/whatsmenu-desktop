import { HttpClient, HttpClientModule } from '@angular/common/http'
import { APP_INITIALIZER, DEFAULT_CURRENCY_CODE, LOCALE_ID, NgModule, isDevMode } from '@angular/core'
import { BrowserModule, Title } from '@angular/platform-browser'
import { NgMetro4Module } from 'ng-metro4'
import { IConfig, NgxMaskModule } from 'ngx-mask'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { HeaderComponent } from './header/header.component'
import { HomeComponent } from './home/home.component'
import { ProductComponent } from './modals/cart/product/product.component'
// import { CustomProductComponent } from './modals/cart/custom-product/custom-product.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { SWIPER_CONFIG, SwiperConfigInterface, SwiperModule } from 'ngx-swiper-wrapper'

// ANGULAR CDK

import { DragDropModule } from '@angular/cdk/drag-drop'

// ANGULAR MATERIAL
import { MatBadgeModule } from '@angular/material/badge'
import { MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'

import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatSidenavModule } from '@angular/material/sidenav'
import { BackButtonDisableModule } from 'angular-disable-browser-back-button'
import { AddressComponent } from './address/address.component'
import { AlertComponent } from './modals/alert/alert.component'
import { CartComponent } from './modals/cart/cart.component'
import { PizzaComponent } from './modals/pizza/pizza.component'
import { ItemRequiredComponent } from './modals/product/item-required/item-required.component'
import { ControlDialogFlavorsComponent } from './pizza/control-dialog-flavors/control-dialog-flavors.component'

// import { MatGoogleMapsAutocompleteModule } from '@angular-material-extensions/google-maps-autocomplete';
// import { AgmCoreModule } from '@agm/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner'
import { CartDetailsComponent } from './modals/cart-details/cart-details.component'
import { DialogConfirmDateComponent } from './modals/dialog-confirm-date/dialog-confirm-date.component'
import { DialogConfirmComponent } from './modals/dialog-confirm/dialog-confirm.component'
import { QrcodeComponent } from './qrcode/qrcode.component'
import { TableComponent } from './table/table.component'
// import { DialogConfirmComponent } from './dialog-confirm/dialog-confirm.component';
import { NgIf, registerLocaleData } from '@angular/common'
import localePt from '@angular/common/locales/pt'
import localeFrCH from '@angular/common/locales/fr-CH'
import localePtPT from '@angular/common/locales/pt-PT'
import { MatBottomSheetModule } from '@angular/material/bottom-sheet'
import { MatSelectModule } from '@angular/material/select'
import { ServiceWorkerModule } from '@angular/service-worker'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { NgbAlertModule, NgbCollapseModule, NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { MatKeyboardModule } from 'angular-onscreen-material-keyboard'
import { NgxPrintModule } from 'ngx-print'
import { BartenderComponent } from './bartender/bartender.component'
import { InfoModalComponent } from './bartender/info-modal/info-modal.component'
import { MenuComponent } from './bartender/menu/menu.component'
import { TotalFormPaymentComponent } from './components/total-form-payment/total-form-payment.component'
import { AccordionComponent } from './generics/accordion/accordion.component'
import { CountdownComponent } from './generics/countdown/countdown.component'
import { LoadingComponent } from './generics/loading/loading.component'
import { PaymentButtonComponent } from './generics/payment-button/payment-button.component'
import { CartPaymentCardCheckCvvComponent } from './modals/cart-payment-card-check-cvv/cart-payment-card-check-cvv.component'
import { CartPaymentCardOptionsComponent } from './modals/cart-payment-card-options/cart-payment-card-options.component'
import { CartPaymentComponent } from './modals/cart-payment/cart-payment.component'
import { ClientidComponent } from './modals/clientid/clientid.component'
import { CommandComponent } from './modals/command/command.component'
import { ConfirmOrderComponent } from './modals/confirm-order/confirm-order.component'
import { ListAdressesComponent } from './modals/list-adresses/list-adresses.component'
import { MoreinfoComponent } from './modals/moreinfo/moreinfo.component'
import { OpenhourComponent } from './modals/openhour/openhour.component'
import { PaymentTypeComponent } from './modals/payment-type/payment-type.component'
import { ProductOptionsComponent } from './modals/product-options/product-options.component'
import { TableResumeComponent } from './modals/table-resume/table-resume.component'
import { CalendarComponent } from './pdv/calendar/calendar.component'
import { ComplementsComponent } from './pdv/complements/complements.component'
import { BartenderLoginComponent } from './pdv/modals/bartender-login/bartender-login.component'
import { CartRepeatComponent } from './pdv/modals/cart-repeat/cart-repeat.component'
import { CartResumeComponent } from './pdv/modals/cart-resume/cart-resume.component'
import { CartTypeComponent } from './pdv/modals/cart-type/cart-type.component'
import { CashierCloseComponent } from './pdv/modals/cashier-close/cashier-close.component'
import { CashierLoginComponent } from './pdv/modals/cashier-login/cashier-login.component'
import { CashierTransactionsComponent } from './pdv/modals/cashier-transactions/cashier-transactions.component'
import { CashierComponent } from './pdv/modals/cashier/cashier.component'
import { ClientAddressComponent } from './pdv/modals/client-address/client-address.component'
import { ClientSearchListComponent } from './pdv/modals/client-search-list/client-search-list.component'
import { ClientStoreComponent } from './pdv/modals/client-store/client-store.component'
import { CommandResumeComponent } from './pdv/modals/command-resume/command-resume.component'
import { CommandsComponent } from './pdv/modals/commands/commands.component'
import { ConfirmPrintComponent } from './pdv/modals/confirm-print/confirm-print.component'
import { NavbarshopComponent } from './pdv/modals/navbarshop/navbarshop.component'
import { NewcommandComponent } from './pdv/modals/newcommand/newcommand.component'
import { PaymentComponent } from './pdv/modals/payment/payment.component'
import { PizzaFlavorComplementsComponent } from './pdv/modals/pizza-flavor-complements/pizza-flavor-complements.component'
import { SwitchTableComponent } from './pdv/modals/switch-table/switch-table.component'
import { AddressFormComponent } from './pdv/partials/address-form/address-form.component'
import { CartItensComponent } from './pdv/partials/cart-itens/cart-itens.component'
import { CashierResumeComponent } from './pdv/partials/cashier-resume/cashier-resume.component'
import { FeesTableComponent } from './pdv/partials/fees-table/fees-table.component'
import { MenuNavComponent } from './pdv/partials/menu-nav/menu-nav.component'
import { TablesComponent } from './pdv/partials/tables/tables.component'
import { PdvComponent } from './pdv/pdv.component'
import { StatusComponent } from './status/status.component'
import { ToastsContainerComponent } from './toasts-container/toasts-container.component'
import { NotifcationPermissionComponent } from './modals/notifcation-permission/notifcation-permission.component'
import { LatestRequestsComponent } from './modals/latest-requests/latest-requests.component'
import { CashbackComponent } from './modals/cashback/cashback.component'
import { TranslateService } from './translate.service'

// Register the localization
registerLocaleData(localePt, 'pt-BR')
registerLocaleData(localeFrCH, 'fr-CH')
registerLocaleData(localePtPT, 'pt-PT')

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
  direction: 'horizontal',
  slidesPerView: 'auto',
}

export let options: Partial<IConfig> | (() => Partial<IConfig>)

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    ProductComponent,
    PizzaComponent,
    CartComponent,
    AddressComponent,
    ItemRequiredComponent,
    ControlDialogFlavorsComponent,
    AlertComponent,
    TableComponent,
    QrcodeComponent,
    DialogConfirmDateComponent,
    DialogConfirmComponent,
    CommandComponent,
    TableResumeComponent,
    BartenderComponent,
    BartenderLoginComponent,
    MenuComponent,
    InfoModalComponent,
    PdvComponent,
    CashierLoginComponent,
    MenuNavComponent,
    CashierComponent,
    CashierResumeComponent,
    CashierTransactionsComponent,
    CashierCloseComponent,
    ClientStoreComponent,
    LoadingComponent,
    CartTypeComponent,
    AccordionComponent,
    CartRepeatComponent,
    CartItensComponent,
    PaymentComponent,
    CartResumeComponent,
    FeesTableComponent,
    TablesComponent,
    NewcommandComponent,
    CommandsComponent,
    CommandResumeComponent,
    SwitchTableComponent,
    ToastsContainerComponent,
    ClientSearchListComponent,
    ClientAddressComponent,
    AddressFormComponent,
    StatusComponent,
    MoreinfoComponent,
    OpenhourComponent,
    ClientidComponent,
    ListAdressesComponent,
    NavbarshopComponent,
    ProductOptionsComponent,
    ConfirmOrderComponent,
    CalendarComponent,
    ComplementsComponent,
    PizzaFlavorComplementsComponent,
    PaymentTypeComponent,
    CountdownComponent,
    ConfirmPrintComponent,
    TotalFormPaymentComponent,
    CartPaymentComponent,
    CartDetailsComponent,
    PaymentButtonComponent,
    CartPaymentCardCheckCvvComponent,
    CartPaymentCardOptionsComponent,
    NotifcationPermissionComponent,
    LatestRequestsComponent,
    CashbackComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgMetro4Module,
    SwiperModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatBottomSheetModule,
    MatCardModule,
    NgxMaskModule.forRoot(),
    BackButtonDisableModule.forRoot(),
    ZXingScannerModule,
    MatSelectModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatExpansionModule,
    MatBadgeModule,
    MatCheckboxModule,
    MatButtonModule,
    MatRadioModule,
    FontAwesomeModule,
    MatKeyboardModule,
    NgbModule,
    MatSidenavModule,
    DragDropModule,
    NgbCollapseModule,
    NgxPrintModule,
    NgbNavModule,
    NgbAlertModule,
    NgIf,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // MatGoogleMapsAutocompleteModule,
    // AgmCoreModule.forRoot({
    //   apiKey: 'AIzaSyAQ86CfA1RgY_d_stSABzYkjufYgGuKaTg',
    //   libraries: ['places']import { CartPaymentComponent } from './modals/cart-payment/cart-payment.component'

    // })
  ],
  providers: [
    Title,
    {
      provide: SWIPER_CONFIG,
      useValue: DEFAULT_SWIPER_CONFIG,
    },
    {
      provide: LOCALE_ID,
      useValue: localStorage.lang,
    },
    {
      provide: DEFAULT_CURRENCY_CODE,
      deps: [TranslateService],
      useValue: localStorage.currency,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
