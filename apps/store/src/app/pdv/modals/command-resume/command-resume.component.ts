import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faArrowLeft, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { CartPizza } from 'src/app/cart-pizza';
import { CartType } from 'src/app/cart-type';
import { ApiService } from 'src/app/services/api/api.service';
import { CartService } from 'src/app/services/cart/cart.service';
import { ContextService } from 'src/app/services/context/context.service';
import Command from 'src/classes/command';
import Table from 'src/classes/table';

@Component({
  selector: 'app-command-resume',
  templateUrl: './command-resume.component.html',
  styleUrls: ['./command-resume.component.scss', '../../../../styles/modals.scss']
})
export class CommandResumeComponent implements OnInit {
  cart: CartType[]
  cartPizza: CartPizza[]
  command: Command

  faArrowLeft = faArrowLeft
  faChevronDown = faChevronDown

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) private dialogRef,
    public context: ContextService,
    public cartService: CartService,
    public api: ApiService,
  ) { }

  async ngOnInit(): Promise<void> {
    setTimeout(() => {
      const firstAccordion = document.querySelector('.cart-accordion') as HTMLDetailsElement
      if (firstAccordion) {
        firstAccordion.open = true
      }
    }, 0);
    this.command = this.context.getActiveCommand()
  }
  
  public close(data?: Command): void {
    this.dialogRef.close(data)
  }

  // API
  public async changeCartStatus(cart: any, status: null | 'transport' | 'canceled' | 'production' ): Promise<void> {
    try {
      const result: any = await this.api.changeCartStatus(status, cart.id, this.context.profile?.slug)
      const cartToUpdate = this.command.carts.findIndex(cart => cart.id === result.cart.id)
      cart.status = result.status
      this.command.carts[cartToUpdate] = result.cart
      this.context.updateActiveCommand(this.command)  
      // if(this.command.carts.some(cart => cart.status !== 'canceled')) return
      // this.dialogRef.close(new Command(this.command))
    } catch (error) {
      console.error(error);
    }
  }
}
