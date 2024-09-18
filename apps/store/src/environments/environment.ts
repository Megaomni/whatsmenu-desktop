// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,

  // LOCAL
  // apiUrl: 'http://localhost:3333/api/v2/business',
  // apiWS: 'ws://localhost:3333/adonis-ws',
  // apiUrlRequest: 'http://localhost:3333/api/v2/business',
  // apiLocalRequest: 'http://127.0.0.1:5555',
  // nextApi: 'http://localhost:3000/api',
  // apiUrlV3: 'http://localhost:3339/api/v3/business',

  // BETA
  // apiUrl: 'https://beta.whatsmenu.com.br/api/v2/business',
  // apiWS: 'wss://beta.whatsmenu.com.br/adonis-ws',
  // apiUrlRequest: 'https://beta.whatsmenu.com.br/api/v2/business',
  // apiLocalRequest: 'https://homosite.whatsmenu.com.br',
  // nextApi: 'https://next.whatsmenu.com.br/api',
  // apiUrlV3: 'https://beta3.whatsmenu.com.br/api/v3/business',

  // PRODUCTION
  apiUrl: 'https://api2.whatsmenu.com.br/api/v2/business',
  apiWS: 'wss://rt3.whatsmenu.com.br/adonis-ws',
  apiUrlRequest: 'https://rt3.whatsmenu.com.br/api/v2/business',
  apiLocalRequest: 'https://whatsmenu.com.br',
  nextApi: 'https://next.whatsmenu.com.br/api',
  apiUrlV3: 'https://api3.whatsmenu.com.br/api/v3/business',

  // btoken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTU5MTk4NTA0MX0.FhohPrsTttwxTEZMhMLlpoH4GTpjdk2pZScVyRH38Kc',

  webpushPublicKey: 'BDg2D_z_SeqYi_MEBd82RWQCdIR1dMcAYRn9B3mRov9Rgq0Ik7UvcxmaZBtjOzAov49BE4KYoD0th2oX-Etgokw',
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
