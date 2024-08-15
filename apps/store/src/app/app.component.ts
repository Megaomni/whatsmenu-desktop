import { Component } from '@angular/core'
import { TranslateService } from './translate.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'sistemaDelivery'

  constructor(public translate: TranslateService) {}
}
