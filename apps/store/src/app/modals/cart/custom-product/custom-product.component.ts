import { Component, OnInit, EventEmitter } from '@angular/core';
import { M4DialogDataEmitter, M4DialogDataInput } from 'ng-metro4';

import { ClientType } from 'src/app/client-type';
import { AddonType } from 'src/app/addon-type';
import { CartCustomProductsType } from 'src/app/cart-custom-products-type';
import { CartType } from 'src/app/cart-type';
import { CategoryType } from 'src/app/category-type';

@Component({
  selector: 'app-custom-product',
  templateUrl: './custom-product.component.html',
  styleUrls: ['./custom-product.component.scss']
})
export class CustomProductComponent implements OnInit, M4DialogDataEmitter<CartCustomProductsType>, M4DialogDataInput<any> {

  addons: AddonType[] = [];
  cart: CartCustomProductsType = {
    id: undefined,
    name: undefined,
    type: undefined,
    image: undefined,
    status: undefined,
    flavors: undefined,
    description: undefined,
    quantity: undefined,
    value: 0,
    products: [],
    addons: [],
    obs: undefined
  };

  originalValue: number;

  controlItens = [];
  min = 0;
  clientData: ClientType;
  products: CartType[] = [];
  categories: CategoryType[];
  dialogDataEmitter = new EventEmitter<CartCustomProductsType>();
  dialogDataInput: any;
  select = [];

  constructor() { }

  ngOnInit(): void {

    if (this.dialogDataInput.cart) {
      this.cart = this.dialogDataInput.cart;

    } else {

      const { id, flavors, image, name, status, description, type, value } = this.dialogDataInput.item;
      this.cart.name = name;
      this.cart.id = id;
      this.cart.flavors = flavors;
      this.cart.type = type;
      this.cart.image = image;
      this.cart.status = status;
      this.cart.value = value;
      this.originalValue = value;
      this.cart.description = description;
      this.cart.quantity = 1;
      this.categories = this.dialogDataInput.item.categories;
      // this.categories.forEach((category, index) => {
      //   if (category.addons.length > 0) {
      //     this.addAddon(category.addons[0]);
      //   }
      //   this.select[index] = 0;
      //   category.itens.forEach((item: CartType) => item.quantity = 0);
      // });
      console.log(this.select);
      // console.log(this.cart);
    }

    this.clientData = this.dialogDataInput.client;
    // console.log(this.categories);

    this.dialogDataEmitter.emit(this.cart);
  }

  // public addItemToCart(item: CartType, category: CategoryType, indexItem: number) {

  //   let q = 0;
  //   category.itens.forEach(ic => q += ic.quantity);
  //   let flavors = category.flavors;

  //   if (this.cart.flavors) {
  //     flavors = this.cart.flavors;
  //   }

  //   if (q < flavors || !this.cart.flavors && !category.flavors) {
  //     const index = this.cart.products.findIndex(product => product.id === item.id);
  //     // console.log({indexFind: index});
  //     if (index === -1) {
  //       item.quantity++;
  //       this.cart.products.push(item);

  //     } else {
  //       // item.quantity++;
  //       this.cart.products[index].quantity++;

  //     }

  //     switch (this.cart.type) {
  //       case 'fixed':
  //         this.cart.value = this.originalValue + this.cart.addons.reduce((a, b) => a + b.value, 0);
  //         break;

  //       case 'pizza':
  //         if (this.cart.value < item.value) {
  //           this.cart.value = item.value; // + this.addons.reduce((a, b) => a + b.value, 0);
  //         }
  //         break;

  //       case 'sum':
  //         this.cart.value = this.originalValue + this.cart.products.reduce((a, b) => a + (b.value * b.quantity), 0) + this.cart.addons.reduce((a, b) => a + b.value, 0);
  //         break;

  //       default:
  //         break;
  //     }

  //   }
  //   // console.log(this.cart);
  // }

  // public removeItem(item: CartType, itemIndex: number) {
  //   const index = this.cart.products.findIndex((product) => item.id === product.id);

  //   if (index > -1) {
  //     this.cart.products[index].quantity--;
  //     if (this.cart.products[index].quantity < 1) {
  //       this.cart.products.splice(index, 1);
  //     }
  //   }
  // }

  public blockItem(product: CartType) {
    return (this.cart.products.reduce((a, b) => a + b.quantity, 0) >= this.cart.flavors && product.quantity === 0);
  }

  public addAddon(addon: AddonType) {
    if (this.cart.addons.length > 0) {
      if (this.cart.addons[0].id !== addon.id) {
        this.cart.addons.pop();
        this.cart.addons.push(addon);
      }
    } else {
      this.cart.addons.push(addon);
    }
    // console.log(this.cart);
  }

  setAddonSelected(addon: number, index: number) {
    this.select[index] = addon;
  }

}
