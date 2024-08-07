import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { faCalendarAlt, faFileAlt } from '@fortawesome/free-regular-svg-icons';
import { ContextService } from 'src/app/services/context/context.service';

@Component({
  selector: 'app-cart-type',
  templateUrl: './cart-type.component.html',
  styleUrls: ['./cart-type.component.scss', '../../../../styles/modals.scss']
})
export class CartTypeComponent implements OnInit {
  faFileAlt = faFileAlt
  faCalendarDay = faCalendarAlt

  constructor(
    @Inject(MatDialogRef) private dialogRef,
    public context: ContextService,
    ) { }

  ngOnInit(): void {
  }

  public close(data: { type: 'D' | 'P' }) {
    this.dialogRef.close(data)
  }
}
