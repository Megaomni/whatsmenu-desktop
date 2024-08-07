import { Component, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { AddressType } from 'src/app/address-type'
import { AddressComponent } from 'src/app/address/address.component'
import { ApiService } from 'src/app/services/api/api.service'
import { ContextService } from 'src/app/services/context/context.service'
import { ToastService } from 'src/app/services/ngb-toast/toast.service'

@Component({
  selector: 'app-client-address',
  templateUrl: './client-address.component.html',
  styleUrls: ['./client-address.component.scss'],
})
export class ClientAddressComponent {
  address: AddressType
  clientId: number
  fromList = false

  faArrowLeft = faArrowLeft

  oldAddresses: AddressType[] = []

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: 'list' | 'create' | 'update'; clientId: number; addresses: AddressType[] },
    @Inject(MatDialogRef) private dialogRef,
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.clientId = this.data.clientId
    switch (this.data.type) {
      case 'list':
        this.address = this.data.addresses[0]
        break
      case 'create':
        this.address = {
          street: '',
          number: '',
          neighborhood: '',
          zipcode: '',
          city: '',
          uf: this.context.profile.address.state,
          complement: '',
          reference: '',
          distance: 0,
        }
        break
    }
    if (this.oldAddresses && this.data.addresses !== undefined) this.oldAddresses = JSON.parse(JSON.stringify(this.data.addresses)) //Salva endereços já resgistrados para exibir no front
  }

  public close(data?: { address?: AddressType; addressId?: number; goBack?: boolean; oldAddresses?: AddressType[] }): void {
    this.dialogRef.close({ ...data })
  }

  public goBack() {
    const address = this.oldAddresses.find((ad) => ad.id === this.address.id)
    this.dialogRef.close({ address: address, goBack: true, oldAddresses: this.oldAddresses })
  }

  public updateAddress(address: AddressType): void {
    this.address = address
    this.data.type = 'update'
  }

  public setAddress(address: AddressType): void {
    this.address = address
    this.close({ address: this.address, oldAddresses: this.oldAddresses, addressId: this.address.id })
  }

  public async saveAddress(): Promise<void> {
    const { street, city } = this.address
    if (!street || !city) {
      return this.toastService.show(`Os seguintes campos são obrigatórios: ${street ? '': 'Logradouro'  } ${ city ? '' : 'Cidade'} `, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    }
    try {
      this.address.controls = this.address.controls ?? {}
      delete this.address.created_at
      delete this.address.deleted_at
      delete this.address.updated_at
      const { address } = await this.api[this.data.type === 'create' ? 'clientCreateAddress' : 'clientUpdateAddress']({
        address: this.address,
        slug: this.context.profile.slug,
        clientId: this.clientId,
      })
      this.address = address
    } catch (error) {
      console.error(error)
      return this.toastService.show(error.error.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      this.close(
        this.data.type === 'create'
          ? { address: this.address, oldAddresses: this.oldAddresses }
          : { addressId: this.address.id, oldAddresses: this.oldAddresses }
      )
    }
  }

  public toCreateFromList() {
    this.data.type = 'create'
    this.fromList = true
  }
}
