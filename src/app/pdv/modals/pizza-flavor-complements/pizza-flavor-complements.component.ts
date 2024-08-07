import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CartService } from 'src/app/services/cart/cart.service';

@Component({
  selector: 'app-pizza-flavor-complements',
  templateUrl: './pizza-flavor-complements.component.html',
  styleUrls: ['./pizza-flavor-complements.component.scss', '../../../pdv/pdv.component.scss', '../../../../styles/modals.scss', '../../../bartender/info-modal/info-modal.component.scss',]
})
export class PizzaFlavorComplementsComponent implements OnInit, OnDestroy {
  constructor(
    @Inject(MatDialogRef) private dialogRef,
    @Inject(MAT_DIALOG_DATA) public data,
    public cartService: CartService,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }
}
