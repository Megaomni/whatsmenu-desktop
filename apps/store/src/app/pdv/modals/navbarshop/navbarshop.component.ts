import { Size } from '@agm/core/services/google-maps-types';
import { Component, Input, OnInit } from '@angular/core';
import { CartPizza } from 'src/app/cart-pizza';
import { CategoryType } from 'src/app/category-type';
import { ClientType } from 'src/app/client-type';
import { PizzaFlavorType, PizzaProductType, PizzaSizeType } from 'src/app/pizza-product-type';


@Component({
  selector: 'app-navbarshop',
  templateUrl: './navbarshop.component.html',
  styleUrls: ['./navbarshop.component.scss', '../../../modals/pizza/pizza.component.scss'], 

})
export class NavbarshopComponent  implements OnInit {
  @Input() pizza: PizzaProductType
  @Input() clientData: ClientType
  @Input() sizeName: string
  @Input() countFlavors: number
  active = 1;
  tabs = []
  cover: string;
  selectedProducts: any[];

  
 
  ngOnInit(): void {
   this.tabs =  new Array(this.countFlavors).fill(1).map((item, index) => (index + 1))
  }

  
  onProductSelected(product: any, tabIndex: number) {
    this.selectedProducts[tabIndex] = product;
  }
  
  calcularTotal() {
    let total = 0;
    for (const product of this.selectedProducts) {
      if (product) {
        total += product.values[this.sizeName]; 
      }
    }
    return total;
  }
}
