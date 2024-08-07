// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { NgModule } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { NgMetro4Module } from 'ng-metro4';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatLegacyCardModule } from '@angular/material/legacy-card';
import { NgxMaskModule } from 'ngx-mask';
import { BackButtonDisableModule } from 'angular-disable-browser-back-button';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatKeyboardModule } from 'angular-onscreen-material-keyboard';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DragDropModule } from '@angular/cdk/drag-drop';


@NgModule({
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
    MatLegacyCardModule,
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
    DragDropModule
    // MatGoogleMapsAutocompleteModule,
    // AgmCoreModule.forRoot({
    //   apiKey: 'AIzaSyAQ86CfA1RgY_d_stSABzYkjufYgGuKaTg',
    //   libraries: ['places']
    // })
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} }
  ]
})
class GlobalTestingSetupModule { }
// First, initialize the Angular testing environment.
getTestBed().resetTestEnvironment()
getTestBed().initTestEnvironment(
  [
    GlobalTestingSetupModule,
    BrowserDynamicTestingModule,
  ],
  platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: false }
}
);
