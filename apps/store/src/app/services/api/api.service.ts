import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { CartPizza } from 'src/app/cart-pizza'
import { CartType } from 'src/app/cart-type'
import { PizzaFlavorType, PizzaImplementationType, PizzaProductType } from '../../pizza-product-type'
import { environment } from 'src/environments/environment'

import { DateTime } from 'luxon'
import { CreateCardTokenType } from 'src/app/asaas-type'
import { CartRequestType } from 'src/app/cart-request-type'
import { CustomerType } from 'src/app/customer-type'
import { CartFormPaymentType } from 'src/app/formpayment-type'
import { CustomerCardTypeWithCodeAndId } from 'src/app/modals/cart-payment/cart-payment.component'
import { TableType } from 'src/app/table-type'
import Command, { CommandType } from 'src/classes/command'
import Table, { TableOpenedType } from 'src/classes/table'
import { AddressType } from '../../address-type'
import { CashierType } from '../../cashier-type'
import { ClientType } from '../../client-type'
import { CupomType } from '../../cupom'
import { CustonProductType } from '../../custon-product-type'
import { DeliveryType } from '../../delivery-type'
import { ComplementType, ProductType } from '../../product-type'
import { ProfileType } from '../../profile-type'
import { ContextService } from '../context/context.service'

import { Observable } from 'rxjs'
interface Config {
  typeDelivery?: boolean
  obs?: boolean
  table?: boolean
  resume?: boolean
}

interface BartenderAuthCredentials {
  bartenderId: number
  password: string
  tableId?: string | number
  type?: 'bartender' | 'pdv'
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // headers = new HttpHeaders({
  //   'Content-Type': 'application/json',
  //   Authorization: `Bearer ${environment.btoken}ASDASD`
  // });
  ipAddress = ''
  clientCategories = []
  constructor(private http: HttpClient, private route: Router, private context: ContextService) {}

  verifyOrder(cartId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!cartId) throw new Error('Carrinho inválido')
      try {
        this.http.get(`${environment.apiUrl}/asaas/order/${cartId}`).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  /**
   * Recupera o status de um carrinho pelo seu ID.
   *
   * @param {number} cartId - O ID do carrinho.
   * @returns {Promise<Pick<CartType, 'status' | 'id'>>} Retorna um objeto com o status e o ID do carrinho.
   * @throws {Error} Lança um erro se o ID do carrinho for inválido.
   */
  getCartStatus({ cartId, slug }: { cartId: number; slug: string }): Promise<Pick<CartType, 'status' | 'id'>> {
    return new Promise((resolve, reject) => {
      if (!cartId) throw new Error('Carrinho inválido')
      try {
        this.http.get(`${environment.apiUrlV3}/${slug}/cart/${cartId}/getStatus`).subscribe(
          (api: Pick<CartType, 'status' | 'id'>) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  processCard(
    slug: string,
    request: { card: CustomerCardTypeWithCodeAndId; order: any; restaurantWalletId: string; clientId: number }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrl}/asaas/order/card/${slug}/`, request).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  saveCard(clientId: number, body: CreateCardTokenType): Promise<{ client: CustomerType }> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrl}/asaas/card/token/${clientId}/`, body).subscribe(
          (api: { client: CustomerType }) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  deleteCard(slug: string, body: { clientId: number; creditCardNumber: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.delete(`${environment.apiUrl}/asaas/card/token/${slug}/`, { body }).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  // getIPAddress(): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       this.http.get('http://api.ipify.org/?format=json').subscribe(
  //         (api) => resolve(api),
  //         (error) => reject(error)
  //       )
  //     } catch (error) {
  //       reject(error)
  //     }
  //   })
  // }

  createRestaurantCustomer(request: any) {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrl}/asaas/customer/${this.context.profile.slug}`, request).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  getPix(
    slug: string,
    request: {
      externalReference: {
        cartId?: number
        commandId?: number
        tableId?: number
      }
      billingType: string
      dueDate: string
      name: string
      document: string
      value: number
      description: string
      walletId: string
      clientId: number
    }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(`${environment.apiUrl}/asaas/order/pix/${slug}/`, { ...request, externalReference: JSON.stringify(request.externalReference) })
          .subscribe(
            (api) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  findPix(slug: string, orderId: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/asaas/order/${orderId}`, { headers: { authorization: token } }).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  verifPixPdv(body: { tableId?: number; commandId?: number; cartId?: number; paymentId: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrl}/asaas/verifyPix/pdv`, body).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  deletePixPdv(body: { tableId?: number; commandId?: number; paymentId: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrl}/asaas/deletePix/pdv`, body).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  async getClientData(
    client = environment.production ? this.getCookie('slug') : 'restaurantbrazil',
    type = '',
    bartenderId?: string | number
  ): Promise<ProfileType> {
    const bartenderIdQueryString = bartenderId ? `?bartenderId=${bartenderId}` : ''
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/${client}/profile/${type}${bartenderIdQueryString}`).subscribe(
          (api: ProfileType) => resolve(api),
          (error: HttpErrorResponse) => reject(error)
        )
      } catch (error) {
        console.error(error)
        alert('Falha na conexão, verifique sua internet!')
        location.reload()
        reject(error)
      }
    })
  }

  async getByCustomProduct(client: string, id: number): Promise<CustonProductType> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/${client}/products/custon/${id}`).subscribe((api: CustonProductType) => resolve(api))
      } catch (error) {
        console.error(error)
        alert('Falha na conexão, verifique sua internet!')
        reject(error)
      }
    })
  }

  async getCupom(slug: string, code: string, clientId: number): Promise<CupomType> {
    return new Promise((resolve, reject) => {
      this.http.get(`${environment.apiUrlV3}/${slug}/cupom?code=${encodeURIComponent(code.toUpperCase())}&clientId=${clientId}`).subscribe(
        (api: CupomType) => resolve(api),
        (error) => reject(error)
      )
    })
  }

  async getRequestCode(client: string): Promise<{ request: number }> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/${client}/request`).subscribe(
          (api: { request: number }) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        console.error(error)
        alert('Falha na conexão, verifique sua internet!')
        reject(error)
      }
    })
  }

  getCommandRequests(commandId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/commandRequests/${commandId}`).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  postRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrlRequest}/request`, request).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  postRequestToNext(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrlRequest}/request`, request).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  postCallBartender(client: string, body: { tableId: number; commandId: number; commandName: string; openedId: number }): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrlRequest}/${client}/profile/joinqueue/bartender`, body).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  deleteCallBartender(client: string, id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.delete(`${environment.apiUrlRequest}/${client}/${id}/profile/leavequeue/bartender`).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  postCommand(
    command: {
      tableId: any
      name: string
      status: number
      slug: string
      cashierId?: number
    },
    isBartender = false
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrlRequest}/command`, command).subscribe(
          (api: { command: CommandType; opened: TableOpenedType }) => {
            if (!isBartender) {
              sessionStorage.setItem(`@whatsmenu-${command.slug}:tableOpenedId`, String(api.opened.id))
            }
            resolve(api)
          },
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  postCommandToNext(
    command: {
      tableId: any
      name: string
      status: number
      slug: string
    },
    isBartender = false
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrlRequest}/command`, command).subscribe(
          (api: { command: CommandType; opened: TableOpenedType }) => {
            if (!isBartender) {
              sessionStorage.setItem(`@whatsmenu-${command.slug}:tableOpenedId`, String(api.opened.id))
            }
            resolve(api)
          },
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  decryptTableCookie(cookie: any): Promise<any> {
    console.log('cookie', cookie)
    return new Promise((resolve, reject) => {
      try {
        // this.http.post(`http://127.0.0.1:5555/decryptTableCookie`, { cookie: cookie }).subscribe(
        this.http.post(`${environment.apiLocalRequest}/decryptTableCookie`, { cookie: cookie }).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  getCommands(tableId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/commands/${tableId}`).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  getCommand(commandId: number, slug: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/command/${commandId}`).subscribe(
          (command: CommandType) => {
            sessionStorage.setItem(`@whatsmenu-${slug}:tableOpenedId`, String(command.tableOpenedId))
            resolve(command)
          },
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  getTable(tableId: number): Promise<TableType> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/getTable/${tableId}`).subscribe(
          (api: TableType) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  async getTables(profileId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/getTables/${profileId}`).subscribe(
          (api: ClientType) => resolve(api),
          (error: HttpErrorResponse) => reject(error)
        )
      } catch (error) {
        console.error(error)
        alert('Falha na conexão, verifique sua internet!')
        reject(error)
      }
    })
  }

  async getBartenders(profileId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/getBartenders/${profileId}`).subscribe(
          (api: ClientType) => resolve(api),
          (error: HttpErrorResponse) => reject(error)
        )
      } catch (error) {
        console.error(error)
        alert('Falha na conexão, verifique sua internet!')
        reject(error)
      }
    })
  }

  async authBartender({ bartenderId, password, tableId, type = 'pdv' }: BartenderAuthCredentials): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(`${environment.apiUrl}/auth/bartender`, {
            bartenderId,
            password,
            tableId,
            type,
          })
          .subscribe(
            (api) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  async updateRequest(credentials: { bartenderId: number; requestId: number; update: any }): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.patch(`${environment.apiUrlRequest}/request/update`, credentials).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
        // alert('Falha na conexão, verifique sua internet!');
        // console.error({testeJason: error});
      }
    })
  }

  async testPost(client: string) {
    try {
      this.http.post(`https://enrpu7griih7r.x.pipedream.net`, { text: client }).subscribe((a) => console.log(a))
    } catch (error) {
      console.error(error)
    }
  }

  async getInfoByZipCode(zipCode: number | string) {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`https://viacep.com.br/ws/${zipCode}/json/`).subscribe((response) => {
          resolve(response)
        })
      } catch (error) {
        console.error(error)
      }
    })
  }

  // tslint:disable-next-line: max-line-length
  // https://maps.googleapis.com/maps/api/distancematrix/json?origins=nicolau%20paal%20500+praia%20grande+sp&destinations=jair%20roldao%20travessa%20f%2033,%20praia%20grande+sp&key=AIzaSyAQ86CfA1RgY_d_stSABzYkjufYgGuKaTg
  async getDistanceAddress(restaurant: any, client: DeliveryType): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // if (client.distance) {
        //   return resolve(client.distance);
        // }

        // const removes = ['rua ', 'rua: ', 'avenida ', 'avenida: '];
        // removes.forEach(remov => restaurant.street = restaurant.street.toLowerCase().replace(remov, ''));
        // removes.forEach(remov => client.street = client.street.toLowerCase().replace(remov, ''));

        const matrix = {
          origin: `${restaurant.street}, ${restaurant.number} - ${restaurant.neigborhood}, ${restaurant.city} - ${restaurant.state}`,
          // destination: client.textAddress,
          destination: `${client.street}${client.number !== 'SN' ? `, ${client.number}` : ''} - ${client.neighborhood}, ${client.city} - ${
            client.uf
          }`,
        }

        if (client.zipCode) {
          matrix.destination += `,CEP${client.zipCode.replace('-', '')}, Brazil`
        } else {
          matrix.destination += `, Brazil`
        }

        if (restaurant.zipcode) {
          matrix.origin += `,CEP${restaurant.zipcode.replace('-', '')}, Brazil`
        } else {
          matrix.origin += `, Brazil`
        }

        this.http
          .post(`${environment.apiUrl.replace('business', '')}calc/distance`, { origin: matrix.origin, destination: matrix.destination })
          .subscribe((response: any) => resolve(response.distance))
      } catch (error) {
        console.error(error)
        reject(error)
      }
    })
  }

  async getDistanceCoords({
    restaurant,
    latitude,
    longitude,
  }: {
    restaurant: ProfileType['address']
    latitude: number
    longitude: number
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // if (client.distance) {
        //   return resolve(client.distance);
        // }

        const removes = ['rua ', 'rua: ', 'avenida ', 'avenida: ']
        removes.forEach((remov) => (restaurant.street = restaurant.street.toLowerCase().replace(remov, '')))
        // removes.forEach(remov => client.street = client.street.toLowerCase().replace(remov, ''));

        const matrix = {
          origin: `${restaurant.street} ${restaurant.number}, ${restaurant.neigborhood}, ${restaurant.city}/${restaurant.state}`,
          destination: `${latitude},${longitude}`,
          // destination: `${client.street} ${client.number}, ${client.neighborhood}, ${client.city}/${client.uf}`,
        }

        this.http
          .post(`${environment.apiUrl.replace('business', '')}calc/distance`, { origin: matrix.origin, destination: matrix.destination })
          .subscribe((response: any) => resolve(response))
      } catch (error) {
        console.error(error)
        reject(error)
      }
    })
  }

  async getCoords(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          resolve({ lat: position.coords.latitude, lon: position.coords.longitude })
        })
      } else {
        reject('Geo Localização bloqueada!')
      }
    })
  }

  public getADMDate(slug: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/${slug}/getADMDate`).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  public checkProductDisponibility(
    slug: string,
    type: string,
    id: number,
    packagePropertys: {
      packageType: boolean
      packageDate?: string
      amount?: number
      cart?: any
      edit?: boolean
      code?: string
      product?: ProductType | PizzaProductType
    },
    size: string = '',
    flavors: PizzaFlavorType[] = [],
    implementations: PizzaImplementationType[] = [],
    complements: ComplementType[] = []
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(`${environment.apiUrl}/checkProductDisponibility`, {
            type,
            id,
            packageType: packagePropertys.packageType,
            packageDate: packagePropertys.packageDate,
            amount: packagePropertys.amount,
            cart: packagePropertys.cart,
            edit: packagePropertys.edit,
            code: packagePropertys.code,
            size,
            flavors,
            implementations,
            complements,
            slug,
          })
          .subscribe(
            (api) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  public getCookie(name: string) {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=')

      return parts[0] === name ? decodeURIComponent(parts[1]) : r
    }, '')
  }

  public deleteCookie(name: string) {
    return (document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;')
  }

  public returnResumeCart(cart: CartType[] = [], cartPizza: CartPizza[] = [], type: 'default' | 'pizza' = 'default', config: Config) {
    const defaultConfig = {
      typeDelivery: false, // se false não verifica diferença dos itens pelo typeDelivery
      obs: true, // Se false não verifica diferença dos itens mesmo que tenha obs
      table: false, // se table usa verifica os itens pelo valueTable
      resume: true, // Se false retorna o carrinho sem agrupar
    }

    //Configuração da função para diferenciar os itens
    config = { ...defaultConfig, ...config }

    cart = JSON.parse(JSON.stringify(cart))
    cartPizza = JSON.parse(JSON.stringify(cartPizza))

    if (!config.resume) {
      return {
        cart,
        cartPizza,
      }
    }

    function complements(itemAtual: ProductType, elClone: ProductType, valueZero: boolean, addQuantity: boolean) {
      return itemAtual.complements.every((complAtual, compAtualIndex) => {
        //Retorna se todos os complementos e itens são iguais
        return elClone.complements.some((complClone, complCloneIndex) => {
          if (complAtual.itens.length === complClone.itens.length && compAtualIndex === complCloneIndex) {
            return complAtual.itens.every((item) => {
              // retorna se todos os itens dos complementos são iguais
              return complClone.itens.some((itemC) => {
                if (addQuantity) {
                  if (itemC.code === item.code && valueZero) {
                    item.quantity += itemC.quantity
                  }
                }

                return valueZero ? itemC.code === item.code : itemC.code === item.code && item.quantity === itemC.quantity
              })
            })
          }
        })
      })
    }

    if (type === 'default' && cart.length) {
      for (let i = 0; i < cart.length; i++) {
        const itemAtual: CartType = cart[i]
        if (!itemAtual) {
          continue
        }
        cart.forEach((elClone: CartType, indexC) => {
          if (!elClone) {
            return
          }

          const equalsValues = (config.table && itemAtual.valueTable === elClone.valueTable) || (!config.table && itemAtual.value === elClone.value)

          const valueZero =
            (config.table && itemAtual.valueTable === 0 && elClone.valueTable === 0) ||
            (!config.table && itemAtual.value === 0 && elClone.value === 0)

          if (config.obs && (itemAtual.obs !== '' || elClone.obs !== '')) {
            return
          }

          if (indexC !== i) {
            if (itemAtual.id === elClone.id && equalsValues) {
              if (itemAtual.complements.length === elClone.complements.length) {
                if (!itemAtual.complements.length && !elClone.complements.length) {
                  itemAtual.quantity += elClone.quantity
                  cart[indexC] = null
                  return
                }

                if (valueZero && itemAtual.quantity !== elClone.quantity) {
                  return
                }

                const allComplements = itemAtual.complements.every((complAtual) => {
                  return elClone.complements.some((compClone) => complAtual.id === compClone.id && complAtual.itens.length === compClone.itens.length)
                })

                if (allComplements) {
                  const allItens = complements(itemAtual, elClone, valueZero, false)

                  if (allItens) {
                    complements(itemAtual, elClone, valueZero, true)
                    if (
                      (config.table && itemAtual.valueTable > 0 && elClone.valueTable > 0) ||
                      (!config.table && itemAtual.value > 0 && elClone.value > 0)
                    ) {
                      itemAtual.quantity += elClone.quantity
                    }

                    cart[indexC] = null
                    return
                  }
                }
                // cart[indexC] = {}
              }
            }
          }
        })
      }
      cart = cart.filter((item) => item)
    }

    if (type === 'pizza' && cartPizza.length) {
      for (let i = 0; i < cartPizza.length; i++) {
        const itemAtual: CartPizza = cartPizza[i]
        if (!itemAtual) {
          continue
        }
        cartPizza.forEach((el: CartPizza, indexEl) => {
          if (indexEl !== i) {
            if (!el) {
              return
            }

            if (!itemAtual.flavors || !el.flavors || itemAtual.size !== el.size || (config.obs && (itemAtual.obs !== '' || el.obs !== ''))) {
              return
            }

            if (itemAtual.flavors.length === el.flavors.length && itemAtual.implementations.length === el.implementations.length) {
              const allFlavorsCode = itemAtual.flavors.every((flavorItemAtual) => {
                return el.flavors.some((flavorEl) => flavorItemAtual.code === flavorEl.code)
              })

              const allImplementationsCode = itemAtual.implementations.every((impItemAtual) => {
                return el.implementations.some((impEl) => impEl.code === impItemAtual.code)
              })

              if (allFlavorsCode && allImplementationsCode) {
                itemAtual.quantity += el.quantity
                cartPizza[indexEl] = null
              }
            }
          }
        })
      }

      cartPizza = cartPizza.filter((item) => item)
    }

    return {
      cart,
      cartPizza,
    }
  }

  // PDV
  async openCashier(slug: string, bartenderId: number | null, initialValue: number): Promise<{ cashier: CashierType }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(`${environment.apiUrl}/${slug}/cashier/${bartenderId}/open`, {
            initialValue,
          })
          .subscribe(
            (api: { cashier: CashierType }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async addTransaction({ bartenderId, slug, type, value, obs, finality, cashierId }): Promise<{ cashier: CashierType }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .patch(`${environment.apiUrl}/${slug}/cashier/${bartenderId}/addTransaction`, {
            transaction: {
              type,
              value,
              obs,
              finality,
            },
            cashierId,
          })
          .subscribe(
            (api: { cashier: CashierType }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async closeCashier({ bartenderId, slug, closedValues, cashierId }): Promise<{ cashier: CashierType }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .patch(`${environment.apiUrl}/${slug}/cashier/${bartenderId}/close`, {
            closedValues,
            cashierId,
          })
          .subscribe(
            (api: { cashier: CashierType }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async clientRegister({ slug, client, addresses }): Promise<{ client: any }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(`${environment.apiUrl}/${slug}/client`, {
            client,
            addresses,
          })
          .subscribe(
            (api: { client: any }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async clientUpdate({ slug, client, clientId, addresses, clientAddresses }): Promise<{ client: any }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .patch(`${environment.apiUrl}/${slug}/client/${clientId}/update`, {
            client,
            addresses,
            clientAddresses,
          })
          .subscribe(
            (api: { client: any }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async removeCard({ slug, last_four_digits, clientId }): Promise<{ client: any }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(`${environment.apiUrl}/${slug}/client/${clientId}/card`, {
            last_four_digits,
          })
          .subscribe(
            (api: { client: any }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async clientSearch({ slug, filter, search }) {
    return new Promise<any>((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrlV3}/${slug}/clients?${filter}=${search}`).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  async clientFindOne({ slug, clientId }) {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrlV3}/${slug}/findClient/${clientId}`).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  async clientFindClient({ slug, whatsapp }) {
    return new Promise<CustomerType>((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrlV3}/${slug}/findClient?whatsapp=${whatsapp}`).subscribe(
          (api: { client: CustomerType }) => resolve(api.client),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  async clientCreateAddress({ slug, clientId, address }): Promise<{ address: AddressType }> {
    const { id, ...rest } = address
    address = rest
    return new Promise((resolve, reject) => {
      try {
        this.http.post(`${environment.apiUrl}/${slug}/${clientId}/address`, address).subscribe(
          (api: { address: AddressType }) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  async clientUpdateAddress({ slug, clientId, address }): Promise<{ address: AddressType }> {
    return new Promise((resolve, reject) => {
      try {
        this.http.patch(`${environment.apiUrl}/${slug}/${clientId}/address/${address.id}`, address).subscribe(
          (api: { address: AddressType }) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  async storeCart({
    slug,
    cartRequest,
    userAgent,
  }: {
    slug: string
    cartRequest: CartRequestType
    userAgent?: string
  }): Promise<{ cart: CartRequestType }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(`${environment.apiUrlRequest}/${slug}/cart`, {
            ...cartRequest,
            userAgent,
          })
          .subscribe(
            (api: { cart: CartRequestType }) => {
              if (cartRequest.type === 'P') {
                const date = DateTime.fromFormat(cartRequest.packageDate, 'yyyy-MM-dd HH:mm:ss')
                const alreadyExistisInBlocked = this.context.profile.options.package.hoursBlock[date.toFormat('MMdd')]
                if (alreadyExistisInBlocked) {
                  const hour = alreadyExistisInBlocked.hours.find((blockedHour) => blockedHour.hour === date.toFormat('HH:mm'))
                  if (hour) {
                    hour.quantity++
                  } else {
                    alreadyExistisInBlocked.hours.push({ hour: date.toFormat('HH:mm'), quantity: 1 })
                  }
                } else {
                  this.context.profile.options.package.hoursBlock[date.toFormat('MMdd')] = {
                    date: cartRequest.packageDate,
                    hours: [{ hour: date.toFormat('HH:mm'), quantity: 1 }],
                  }
                }
              }
              return resolve(api)
            },
            (error) => {
              if (error.status === 409) {
                this.context.profile?.options.package.specialsDates.push(error.error.date)
                console.log(this.context.profile?.options.package.specialsDates, error)
              }
              if (error.status === 418) {
                this.context.profile?.options.package.hoursBlock
              }
              return reject(error)
            }
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async updateCartFormsPayment({
    cartId,
    formsPayment,
    slug,
    paymentType,
  }: {
    cartId: number
    formsPayment: CartFormPaymentType[]
    slug: string
    paymentType: 'online' | 'local'
  }): Promise<{ cart: CartRequestType }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .patch(`${environment.apiUrlRequest}/${slug}/cart/updateCartFormsPayment`, {
            cartId,
            formsPayment,
            paymentType,
          })
          .subscribe(
            (api: { cart: CartRequestType }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async tablesStatus(tableId: number) {
    return new Promise((resolve, reject) => {
      try {
        this.http.patch(`${environment.apiUrlRequest}/table/status/${tableId}/status`, {}).subscribe(
          (api) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  async changeTable(data: {
    newTableId: number
    oldTableId: number
    commandsIds: number[]
  }): Promise<{ oldTableOpened: TableOpenedType; newTableOpened: TableOpenedType; filterdCommands: CommandType[] }> {
    return new Promise((resolve, reject) => {
      try {
        this.http.patch(`${environment.apiUrlRequest}/command/changeTable`, data).subscribe(
          (api: { oldTableOpened: TableOpenedType; newTableOpened: TableOpenedType; filterdCommands: CommandType[] }) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  async changeCartStatus(status: null | 'transport' | 'canceled' | 'production', id: number, slug: string) {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .patch(`${environment.apiUrl}/${slug}/cart/${id}/status`, {
            status,
            id,
          })
          .subscribe(
            (api) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async setAlreadySent({
    controls,
    id,
    slug,
  }: {
    id: number
    slug: string
    controls: {
      whatsApp: {
        alreadySent: boolean
      }
    }
  }): Promise<{ cart: CartRequestType & { controls: { userAgent: string; whatsApp: { alreadySent: boolean } } } }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .patch(`${environment.apiUrl}/${slug}/cart/${id}/updateCartControls`, {
            controls,
          })
          .subscribe(
            (api: { cart: CartRequestType & { controls: { userAgent: string; whatsApp: { alreadySent: boolean } } } }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  async getCartByCode(slug: string, code: string): Promise<{ cart: CartRequestType & { client: CustomerType } }> {
    return new Promise((resolve, reject) => {
      try {
        this.http.get(`${environment.apiUrl}/${slug}/getCart/${code}`).subscribe(
          (api: { cart: CartRequestType & { client: CustomerType } }) => resolve(api),
          (error) => reject(error)
        )
      } catch (error) {
        console.error(error)
        alert('Falha na conexão, verifique sua internet!')
        reject(error)
      }
    })
  }

  async closeCommand(
    command: Command,
    tableId: number,
    slug: string,
    newPayments: Partial<CartFormPaymentType>[],
    cashierId: number | null = null
  ): Promise<CommandType> {
    if (command) {
      const { id, fees, formsPayment } = command
      return new Promise((resolve, reject) => {
        try {
          this.http
            .patch(`${environment.apiUrlRequest}/${slug}/closeCommand/${id}`, {
              fees,
              formsPayment: [...formsPayment, ...newPayments],
              tableId,
              cashierId,
            })
            .subscribe(
              (api: CommandType) => resolve(api),
              (error) => reject(error)
            )
        } catch (error) {
          reject(error)
        }
      })
    } else {
      throw new Error(`Comanda não definida => ${command}`)
    }
  }

  async updateFormPayment(commandId: number, formsPayment: Partial<CartFormPaymentType>[]): Promise<Partial<CartFormPaymentType>[]> {
    if (commandId) {
      return new Promise((resolve, reject) => {
        try {
          this.http
            .patch(`${environment.apiUrlRequest}/closeCommand/${commandId}`, {
              formsPayment,
            })
            .subscribe(
              (api: Partial<CartFormPaymentType>[]) => resolve(api),
              (error) => reject(error)
            )
        } catch (error) {
          reject(error)
        }
      })
    } else {
      throw new Error(`Comanda não definida => ${commandId}`)
    }
  }

  async closeTable(
    table: Table,
    slug: string,
    newPayments: Partial<CartFormPaymentType>[],
    cashierId: number
  ): Promise<{ table: TableType; cashier: CashierType }> {
    if (table) {
      const { opened } = table
      const { id, fees, formsPayment, commands } = opened
      return new Promise((resolve, reject) => {
        try {
          this.http
            .patch(`${environment.apiUrlRequest}/${slug}/closeTable/${id}`, {
              fees,
              formsPayment: [...formsPayment, ...newPayments],
              commands,
              cashierId,
            })
            .subscribe(
              (api: { table: TableType; cashier: CashierType }) => resolve(api),
              (error) => reject(error)
            )
        } catch (error) {
          reject(error)
        }
      })
    } else {
      throw new Error(`Mesa não definida => ${table}`)
    }
  }

  public printLayout({
    table,
    profile,
    printType,
    cart,
    command,
  }: {
    table: Table
    cart?: CartRequestType
    command?: Command
    profile: ProfileType
    printType: 'table' | 'command'
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(
            `/printLayout`,
            {
              table,
              profile,
              printType,
              cart,
              command,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
          .subscribe(
            (api) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }

  public async printLayoutPDF({
    table,
    profile,
    printType,
    cart,
    command,
  }: {
    table: Table
    cart?: CartRequestType
    command?: Command
    profile: ProfileType
    printType: 'table' | 'command'
  }): Promise<any> {
    return fetch(`${environment.nextApi}/printLayoutPDF`, {
      method: 'POST',
      body: JSON.stringify({
        table,
        profile,
        printType,
        cart,
        command,
      }),
    })
      .then((response) => {
        console.log(response)
        return response.blob()
      })
      .then((blob) => {
        console.log(URL.createObjectURL(blob))
        return URL.createObjectURL(blob)
      })
  }

  async deleteAddress(slug: string, clientId: number, addressId: number): Promise<Observable<any>> {
    const url = `${environment.apiUrl}/${slug}/${clientId}/address/${addressId}`
    return this.http.delete(url)
  }

  async clientSavePushSubscription({
    clientId,
    subscription,
    userAgent,
  }: {
    clientId: number
    subscription: PushSubscription
    userAgent: string
  }): Promise<{ client: any }> {
    return new Promise((resolve, reject) => {
      try {
        this.http
          .post(`${environment.apiUrl}/client/savePushSubscription`, {
            clientId,
            subscription,
            userAgent,
          })
          .subscribe(
            (api: { client: any }) => resolve(api),
            (error) => reject(error)
          )
      } catch (error) {
        reject(error)
      }
    })
  }
}
