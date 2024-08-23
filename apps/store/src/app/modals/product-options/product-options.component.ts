import { Component, Inject, OnInit } from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet} from '@angular/material/bottom-sheet';
import { CartFlavorPizzaType } from 'src/app/cart-pizza';
import { CartType } from 'src/app/cart-type';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-product-options',
  templateUrl: './product-options.component.html',
  styleUrls: ['./product-options.component.scss'],
})


export class ProductOptionsComponent implements OnInit {
  index:number;
  product: CartType | CartFlavorPizzaType
  productType: string

  constructor(public translate: TranslateService, @Inject(MAT_BOTTOM_SHEET_DATA) public data,
  private _bottomSheetRef: MatBottomSheet) { }

  ngOnInit(): void {
    this.index = this.data.index;
    this.product = this.data.product
    this.productType = this.data.productType
  }

  removeProduct(){
    this._bottomSheetRef.dismiss({target: 'remove', index: this.index, product: this.product, productType: this.productType});
  }

  editProduct(){
    this._bottomSheetRef.dismiss({target: 'edit', index: this.index, product: this.product, productType: this.productType})
  }
}


