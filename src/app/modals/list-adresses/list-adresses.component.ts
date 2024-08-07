import { Component, Inject, OnInit, HostListener } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { faPencil, faXmark, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { AddressType } from 'src/app/address-type'
import { AddressComponent, AddressComponentData } from 'src/app/address/address.component'
import { CustomerType } from 'src/app/customer-type'
import { ProfileType } from 'src/app/profile-type'
import { ApiService } from 'src/app/services/api/api.service'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-list-adresses',
  templateUrl: './list-adresses.component.html',
  styleUrls: ['./list-adresses.component.scss'],
})
export class ListAdressesComponent implements OnInit {
  customer: CustomerType
  clientData: ProfileType
  delivery: AddressType | null
  selectedAddressIndex: number

  public isSaveButtonDisabled: boolean = true
  clickedMobileButtonIndex: number

  isMobile: boolean = false
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkIfMobile()
  }

  pencil = faPencil
  delete = faXmark
  verticalEllipsis = faEllipsisV

  constructor(public dialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data, private api: ApiService, private matDialog: MatDialog) {}

  ngOnInit(): void {
    this.checkIfMobile()

    this.customer = this.data.customer
    this.clientData = this.data.clientData
    this.delivery = this.data.delivery

    const localStorageClientInfo = JSON.parse(localStorage.getItem(`${this.clientData.slug}-clientInfo`)) || {}
    this.selectedAddressIndex = this.customer.addresses.findIndex((a) => a.id === localStorageClientInfo.defaultAddressId) || 0

    const defaultAddressId = localStorageClientInfo.defaultAddressId || (this.customer.addresses.length > 0 ? this.customer.addresses[0].id : null)
    if (defaultAddressId && defaultAddressId !== (this.customer.addresses.length > 0 ? this.customer.addresses[0].id : null)) {
      localStorage.removeItem(`${this.clientData.slug}`)
    }
    localStorageClientInfo.defaultAddressId = defaultAddressId
    localStorage.setItem(`${this.clientData.slug}-clientInfo`, JSON.stringify(localStorageClientInfo))
  }

  toggleMobileButtons(index: number) {
    if (index === this.clickedMobileButtonIndex) {
      this.clickedMobileButtonIndex = null
    } else {
      this.clickedMobileButtonIndex = index
    }
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth < 768
  }

  resetMobileButtonState() {
    this.clickedMobileButtonIndex = null
  }

  close() {
    this.dialogRef.close()
  }

  saveAddress() {
    this.dialogRef.close({
      targetModal: 'paymentInfo',
      data: {
        delivery: this.delivery,
        allAddresses: this.customer.addresses,
        clientInfo: this.data.clientInfo,
      },
    })
  }

  changeAddress(index: number) {
    this.selectedAddressIndex = index
    this.delivery = this.customer.addresses[index]
    this.isSaveButtonDisabled = false
  }

  addAddress() {
    this.dialogRef.close({ targetModal: 'addAddress' })
  }

  public editAddress(addressId: number) {
    const confirmDialog = this.matDialog.open<AddressComponent, AddressComponentData, { address: AddressType }>(AddressComponent, {
      autoFocus: false,
      height: window.innerWidth < 700 ? '100vh' : 'auto',
      width: window.innerWidth < 700 ? '100vw' : 'auto',
      maxWidth: window.innerWidth < 700 ? '100vw' : 'auto',
      data: {
        address: this.customer.addresses.find((address) => address.id === addressId) as any,
        clientData: this.clientData,
        customer: this.customer,
        edit: true,
      },
      closeOnNavigation: true,
    })

    confirmDialog.afterClosed().subscribe(({ address }) => {
      if (address) {
        this.delivery = address
        const newAddressIndex = this.customer.addresses.findIndex((a) => a.id === this.delivery.id)
        if (newAddressIndex !== -1) {
          this.customer.addresses[newAddressIndex] = address
        }
        this.resetMobileButtonState()
      }
      return
    })
  }

  public deleteAddress(addressId: number) {
    const confirmDelete = window.confirm('Deseja realmente excluir este endereço?')

    if (confirmDelete) {
      this.api
        .deleteAddress(this.clientData.slug, this.customer.id, addressId)
        .then((observable: Observable<any>) => {
          observable.subscribe(
            (data) => {
              this.updateLocalAddressList(addressId)
            },
            (error) => {
              console.error('Erro ao excluir', error)
            }
          )
        })
        .catch((error) => {
          console.error('Erro ao obter a Promise', error)
        })
    }
  }

  private updateLocalAddressList(addressId: number) {
    const index = this.customer.addresses.findIndex((a) => a.id === addressId)
    if (index !== -1) {
      const removedAddress = this.customer.addresses.splice(index, 1)[0]
      this.selectedAddressIndex = 0

      if (this.data.clientInfo.defaultAddressId === addressId) {
        const nextAddress = this.customer.addresses.length > 0 ? this.customer.addresses[0] : null
        if (nextAddress) {
          this.data.clientInfo.defaultAddressId = nextAddress.id
          localStorage.setItem(`${this.clientData.slug}-clientInfo`, JSON.stringify(this.data.clientInfo))

          this.selectedAddressIndex = 0
          this.delivery = nextAddress
        }
      }
    }
    this.resetMobileButtonState()
  }
}
