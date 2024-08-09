// export type Merchant = {
//     id: string
//     name: string
//     wm_id: string
//     controls: {
//         auth: {
//             codeVerifier: string,
//             token: string,
//             refreshToken: string,
//         }
//     }
// }

export interface MerchantControls {
  dateTokenCreated: string
}
