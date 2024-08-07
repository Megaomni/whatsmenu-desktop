import { AfterViewChecked, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AddressType } from 'src/app/address-type';
import { ApiService } from 'src/app/services/api/api.service';
import { ContextService } from 'src/app/services/context/context.service';
import { ToastService } from 'src/app/services/ngb-toast/toast.service';

@Component({
  selector: 'app-client-store',
  templateUrl: './client-store.component.html',
  styleUrls: ['./client-store.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss']
})
export class ClientStoreComponent implements OnInit, AfterViewChecked {
  addressId: number | null = null;
  addresses: AddressType[] = []
  oldAddresses: AddressType[] = []

  name: string | null = null;
  whatsapp: string = null;
  secretNumber: string = null;
  email: string = null;

  loading: boolean

  faArrowLeft = faArrowLeft


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: 'create' | 'update', client?: any, refId?: number, addressId: number | null },
    @Inject(MatDialogRef) private dialogRef,
    public context: ContextService,
    public api: ApiService,
    public toastService: ToastService,
  ) { }

  ngOnInit(): void {
    if (this.data?.addressId) {
      this.addressId = this.data.addressId
    }
    if (this.data?.client) {
      this.oldAddresses = JSON.parse(JSON.stringify(this.data.client.addresses))
      this.name = this.data.client.name
      this.whatsapp = this.data.client.whatsapp
      this.secretNumber = this.data.client.secretNumber
      this.email = this.data.client.email
    }
    setTimeout(() => {
      if (this.data.refId !== undefined) {
        const address = document.getElementById(`client-address-${this.data.refId}`) as HTMLDivElement
        if (address) {
          const zipinput = address.querySelector('input')
          if (zipinput) {
            zipinput.focus({ preventScroll: true })
          }
          address.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, 1);
  }

  ngAfterViewChecked(): void {
    if (this.data?.client) {
      this.data.client.addresses.forEach((address: any, index) => {
        address.update = !Object.values(this.oldAddresses[index]).every((oldValue, oldIndex) => oldValue === Object.values(address)[oldIndex])
      });
    }
  }

  public close(cancelAddress?: boolean): void {
    if(this.data.client && cancelAddress){
      this.data.client.addresses = this.oldAddresses
    }
    this.dialogRef.close({ addressId: this.addressId })
  }

  public addAddress(): void {
    this.addresses.push({
      street: '',
      number: '',
      neighborhood: '',
      zipcode: '',
      city: '',
      uf: this.context.profile.address.state,
      complement: '',
      reference: '',
      distance: 0
    })

    setTimeout(() => {
      const newAddress = document.getElementById(`new-address-${this.addresses.length - 1}`)
      if (newAddress) {
        newAddress.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 10);
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
          address.city = result.localidade
          address.uf = result.uf
          address.neighborhood = result.bairro
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

  public safariTrash() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') !== -1) {
      if (ua.indexOf('chrome') > -1) {
        return false; // Chrome
      } else if (ua.indexOf('edg') > -1) {
        return false; // Edge
      } else if (ua.indexOf('opr') > -1) {
        return false; // Opera
      } else {
        //  SAFARI
        if (ua.indexOf('iphone') > -1) {
          return true; // Safari IPhone
        } else {
          return false; // Safari Desktop
        }
      }
    }
    return false;
  }

  public async clientAPI(event: any, action: 'create' | 'update'): Promise<void> {
    event.preventDefault()
    if(!this.name || !this.whatsapp) return this.toastService.show('Nome e telefone são obrigatórios', { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    this.loading = true
    const button = document.querySelector('button[type="submit"]') as HTMLButtonElement
    if (button) {
      button.disabled = true
    }

    this.addresses.forEach(address => {
      address.number = Number(address.number) ?? null
    })
    const route = action === 'create' ?
      this.api.clientRegister({
        slug: this.context.profile.slug,
        client: {
          name: this.name,
          whatsapp: this.whatsapp,
          secretNumber: this.secretNumber || null,
          email: this.email || null,
        },
        addresses: this.addresses
      })
      :
      this.api.clientUpdate({
        slug: this.context.profile.slug,
        clientId: this.data.client.id,
        client: {
          name: this.name,
          whatsapp: this.whatsapp,
          secretNumber: this.secretNumber,
          email: this.email,
        },
        addresses: this.addresses,
        clientAddresses: this.data.client.addresses,
      })

    try {
      const { client } = await route
      this.dialogRef.close({ client, addressId: this.addressId })
    } catch (error) {
      console.error(error);
      return this.toastService.show(error.error.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      if (button) {
        button.disabled = false
      }
      this.loading = false
    }
  }

  public trackBy(index: number, item: any): number {
    return item.id;
  }
}
