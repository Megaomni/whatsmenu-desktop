import { ModuleWithProviders, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BartenderComponent } from './bartender/bartender.component';
import { HomeComponent } from './home/home.component';
import { PdvComponent } from './pdv/pdv.component';
import { QrcodeComponent } from './qrcode/qrcode.component';
import { StatusComponent } from './status/status.component';

const routes: Routes = [  
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: ':slug', component: HomeComponent },
  { path: ':slug/status/:code', component: StatusComponent },
  { path: ':slug/qrcode', component: QrcodeComponent },
  { path: ':slug/mesas', component: PdvComponent },
  { path: ':slug/pdv', component: PdvComponent },
  { path: ':slug/image', component: HomeComponent },
  { path: ':slug/:planOffer/:categoryId', component: HomeComponent},
  { path: ':slug/:planOffer/:categoryId/:productId', component: HomeComponent},
];



@NgModule({
  imports: [RouterModule.forRoot(routes, { anchorScrolling: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
