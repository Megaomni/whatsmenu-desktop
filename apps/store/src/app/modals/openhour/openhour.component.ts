import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContextService } from 'src/app/services/context/context.service';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: "app-openhour",
  templateUrl: './openhour.component.html',
  styleUrls: ['./openhour.component.scss']
})
export class OpenhourComponent {
  @Input() collapse: boolean;
  @Output() closeCollapse = new EventEmitter();
  weekDays = [
    {day: 'monday', name: 'Segunda'}, 
    {day: 'tuesday', name: 'Terça'},
    {day: 'wednesday', name: 'Quarta'},
    {day: 'thursday', name: 'Quinta'},
    {day: 'friday', name: 'Sexta'},
    {day: 'saturday', name: 'Sabado'},
    {day: 'sunday', name: 'Domingo'}];

    constructor(
      public context: ContextService,
      public translate: TranslateService,
    ){
    }
  close(){
    this.closeCollapse.emit(true);
  }

  render(index, weekDay){
      return weekDay.day
  }
}
