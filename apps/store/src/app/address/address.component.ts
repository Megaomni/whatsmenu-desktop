import { Component, Inject, OnInit } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { AddressType } from '../address-type'
import { CustomerType } from '../customer-type'
import { DeliveryType } from '../delivery-type'
import { ProfileType } from '../profile-type'
import { ApiService } from '../services/api/api.service'
import { AlertComponent } from './../modals/alert/alert.component'
import { TranslateService } from '../translate.service'

export type AddressComponentData = {
  clientData: ProfileType
  customer: CustomerType
  address?: AddressType
  edit?: boolean
  addressRevalidation?: boolean
}

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
})
export class AddressComponent implements OnInit {
  geoActived = true
  hiddenCEP = false
  showButtonCep = true
  addressRevalidation: boolean = false
  taxDeliveryValue: number

  address: AddressType = {
    street: undefined,
    number: undefined,
    complement: undefined,
    neighborhood: undefined,
    reference: undefined,
    city: undefined,
    distance: undefined,
    zipcode: '',
  }

  // addressComponents: any;
  sn = false

  showFields = false

  neighborhoods: any[] = []

  constructor(
    private api: ApiService,
    private matDialog: MatDialog,
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA)
    public data: AddressComponentData,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.data.clientData = this.data.clientData
    this.data.edit = this.data.edit
    if (this.data.edit && this.data.address) {
      this.address = { ...this.data.address }
    }
    this.address.uf = this.data.clientData.address.state
    this.addressRevalidation = this.data.addressRevalidation
    if (this.data.clientData.typeDelivery !== this.translate.masks().mi) {
      this.geoActived = false
      const city = this.data.clientData.taxDelivery.find((t) => t.city.toLowerCase() === this.data.clientData.address.city.toLowerCase())
      if (city) {
        this.address.city = city.city
      }
      this.loadNeighborhoods()
    }

    if (this.data.clientData.typeDelivery === this.translate.masks().mi) {
      this.getGeoLocation()
    }
  }

  // public onAutocompleteSelected(address) {
  //   console.log({selected: address});
  //   this.delivery.textAddress = address.formatted_address;

  //   this.delivery.street = '-';
  //   this.delivery.city = '-';
  //   this.delivery.neighborhood = '-';

  //   this.addressComponents = address.address_components;

  //   address.address_components.forEach((addr, i) => {
  //     switch (addr.types[0]) {
  //       case 'street_number':
  //         this.delivery.number = addr.long_name;
  //         break;

  //       case 'route':
  //         this.delivery.street = addr.short_name;
  //         break;

  //       case 'sublocality_level_1':
  //         this.delivery.neighborhood = addr.long_name;
  //         break;

  //       case 'administrative_area_level_2':
  //         this.delivery.city = addr.long_name;
  //         break;

  //       case 'administrative_area_level_1':
  //         this.delivery.uf = addr.short_name;
  //         break;

  //       case 'postal_code':
  //         this.delivery.zipCode = addr.long_name;
  //         break;
  //     }
  //   });
  //   this.showFields = true;
  // }

  // public onLocationSelected(address) {
  //   console.log({location: address});
  //   this.delivery.latitude = address.latitude;
  //   this.delivery.longitude = address.longitude;
  // }

  public async searchZipCode() {
    this.address.city = undefined

    if (this.address.zipcode && this.address.zipcode.length === 8) {
      const address: any = await this.api.getInfoByZipCode(this.address.zipcode)

      this.address.city = address.localidade
      this.address.street = address.logradouro
      this.address.neighborhood = address.bairro
      if (this.data.clientData.typeDelivery !== this.translate.masks().mi) {
        this.loadNeighborhoods()
      }
      this.address.street = address.logradouro
      if (this.data.clientData.typeDelivery === this.translate.masks().mi) {
        this.address.neighborhood = address.bairro
      } else {
        const tax = this.neighborhoods.find((t) => t.name.toString().toLowerCase() === address.bairro.toLowerCase())
        if (tax) {
          this.address.neighborhood = address.bairro
        } else {
          this.address.neighborhood = undefined
        }
      }

      if (address.erro) {
        this.address.street = this.translate.text().zip_code_not_found
        if (this.data.clientData.typeDelivery === this.translate.masks().mi) {
          this.address.neighborhood = this.translate.text().zip_code_not_found
          this.address.city = this.translate.text().zip_code_not_found
        } else {
          this.address.neighborhood = undefined
          this.address.city = undefined
        }
      }
      // console.log(this.delivery);
    }
  }

  public loadNeighborhoods() {
    if (this.address.city === 'others') {
      this.neighborhoods = []
    } else {
      const tax = this.data.clientData.taxDelivery.find((t) => t.city.toLowerCase() === (this.address.city ? this.address.city.toLowerCase() : ''))
      if (tax) {
        this.neighborhoods = tax.neighborhoods
      }
    }
  }

  public async close() {
    // this.delivery.distance = await this.api.getDistanceAddress(this.data.clientData.address, this.delivery)

    // if (this.data.edit) {
    //   return this.dialogRef.close({ address: this.address, edit: true })
    // }

    let enableDeliveryAddress: boolean = false

    try {
      const { address } = await this.api[this.data.edit ? 'clientUpdateAddress' : 'clientCreateAddress']({
        slug: this.data.clientData.slug,
        clientId: this.data.customer.id,
        address: this.address,
      })
      this.address = address
      enableDeliveryAddress = this.data.clientData.taxDelivery.some((tax) => tax.distance >= this.address.distance / 1000)
    } catch (error) {
      console.error(error)
      if (error.error) {
        this.matDialog.open(AlertComponent, {
          closeOnNavigation: true,
          data: {
            title: this.translate.text().notice,
            message: `<strong>${this.translate.text().covered_address}</strong><br>`,
            noReload: true,
          },
        })
      }
      return
    }

    this.dialogRef.close({
      address: this.address,
    })
  }

  public validation(): string {
    if (!this.address.city) {
      return this.data.clientData.typeDelivery === this.translate.masks().mi ? this.translate.text().enter_city : this.translate.text().select_city
    }

    if (!this.address.neighborhood) {
      return this.data.clientData.typeDelivery === this.translate.masks().mi
        ? this.translate.text().enter_neighborhood
        : this.translate.text().select_neighborhood
    }

    if (!this.address.street) {
      return this.translate.text().enter_street_name
    }

    if (!this.address.number && parseInt(String(this.address.number), 10) !== 0 && !this.sn) {
      return 'Digite número do endereço'
    }

    return this.translate.text().deliver_this_address
  }

  public changeSN() {
    if (this.sn) {
      this.address.number = 'SN'
    } else {
      this.address.number = undefined
    }
  }

  public getGeoLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (geo) => {
          try {
            const latitude = geo.coords.latitude
            const longitude = geo.coords.longitude

            const matrix = await this.api.getDistanceCoords({ restaurant: this.data.clientData.address, latitude, longitude })
            this.address.distance = matrix.distance

            // console.log({destination: matrix.google.destination_addresses[0]});
            const destination = matrix.google.destination_addresses[0].split(', ')
            // SET ADDRESS
            this.address.street = destination[0]

            this.address.number = destination[1].split(' - ')[0]
            this.address.neighborhood = destination[1].split(' - ')[1]

            this.address.city = destination[2].split(' - ')[0]
            this.address.uf = destination[2].split(' - ')[1]
            // this.delivery.state = destination[2].split(' - ')[1];
            this.geoActived = false
            this.hiddenCEP = true
            // console.log(this.delivery);
          } catch (error) {
            this.geoActived = false
            console.error(error)
          }
        },
        () => {
          this.geoActived = false
        }
      )
    } else {
      this.geoActived = false
      this.matDialog.open(AlertComponent, {
        data: {
          message: this.translate.alert().unable_to_read,
        },
      })
    }
  }

  public closeAddressModal() {
    this.dialogRef.close({ address: null })
  }
}
