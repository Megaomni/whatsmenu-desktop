import { Component, TemplateRef } from '@angular/core';
import { ToastService } from '../services/ngb-toast/toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <ngb-toast
      *ngFor="let toast of toastService.toasts"
      [class]="toast.classname"
      [animation]="toast.animation"
      [autohide]="true"
      [delay]="toast.delay || 5000"
      [header]="toast.header"
      (hidden)="toastService.remove(toast)"
    >
      <ng-template [ngIf]="isTemplate(toast)" [ngIfElse]="text">
        <ng-template [ngTemplateOutlet]="toast.textOrTpl"></ng-template>
      </ng-template>

      <ng-template #text>{{ toast.textOrTpl }}</ng-template>
    </ngb-toast>
  `,
})
export class ToastsContainerComponent {
  constructor(public toastService: ToastService) { }

  isTemplate(toast) { return toast.textOrTpl instanceof TemplateRef; }
}