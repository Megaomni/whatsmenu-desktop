import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddressType } from 'src/app/address-type';
import { ApiService } from 'src/app/services/api/api.service';
import { ContextService } from 'src/app/services/context/context.service';
import { ToastService } from 'src/app/services/ngb-toast/toast.service';
import { NeighborhoodType } from 'src/app/tax-delivery-type';

@Component({
  selector: 'app-address-form',
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.scss']
})
export class AddressFormComponent implements OnInit {
  @Input() index: number
  @Input() address: AddressType
  @Output() addressChange = new EventEmitter<AddressType>();

  public neighborhoods: NeighborhoodType[] = []

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService,
  ) { }

  ngOnInit(): void {
    if (this.context.profile.typeDelivery === 'neighborhood') {
      // this.neighborhoods = this.context.profile.taxDelivery.flatMap((tax) => tax.neighborhoods)
      if (!this.address.city) {
        this.address.city = this.context.profile.taxDelivery[0].city
      }
      this.setNeighborhoodList();
    }
    if (this.data.address) {
      this.address = this.data.address
    }
  }

  public async getInfoByZipCode(address: AddressType, index: number): Promise<void> {
    address.zipcode = address.zipcode ?? ''
    if (address.zipcode.length === 8) {
      const zipCodeInput = document.getElementById(`zipcode-input-${index}`) as HTMLInputElement
      if (zipCodeInput) {
        zipCodeInput.disabled = true
      }
      try {
        const result: any = await this.api.getInfoByZipCode(address.zipcode);
        if (result.erro) {
          throw new Error('CEP inválido!')
        } else {
          address.street = result.logradouro
          address.uf = result.uf
          if (this.context.profile.typeDelivery === 'km') {
            address.city = result.localidade
            address.neighborhood = result.bairro
          }
        }
      } catch (error) {
        console.error(error);
        return this.toastService.show('CEP inválido!', { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
      } finally {
        if (zipCodeInput) {
          zipCodeInput.disabled = false
        }
      }
    }
  }

  public neighborhoodValidation(neighborhood: string) {
    return this.neighborhoods.some(n => n.name === neighborhood)
  }

  public setNeighborhoodList() {
    const city = this.context.profile.taxDelivery.find(c => c.city === this.address.city)
    this.neighborhoods = city.neighborhoods
    this.address.neighborhood = city.neighborhoods[0].name
  }
}
