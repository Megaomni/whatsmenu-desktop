'use strict'
const { google } = require('googleapis')
const { ServiceProvider } = require('@adonisjs/fold')
const moment = require('moment')


class GoogleProvider extends ServiceProvider {
  register () {
    async function googleAuth() {
      const auth = new google.auth.GoogleAuth({
          keyFile: "googleSheetCredencials.json",
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      })

      const client = await auth.getClient()
      const googleSheet = google.sheets({
          version: "v4",
          auth: client,
      })

      return {
          auth,
          googleSheet,
      }
  }

   this.app.singleton('GoogleProvider', () => {
    return {   
  sheets:{
    
    addRowsPlan:async (values, spreadsheetId) => {
      const { googleSheet, auth } = await googleAuth();
      this.register()
      const addRows = await googleSheet.spreadsheets.values.append({
          auth,
          spreadsheetId,
          range: "Página1",
          valueInputOption: "USER_ENTERED",
          resource: {
              values
          }
      })
  }
  }}

  // console.log(addRowsPlan);
   })
  }
}

module.exports = GoogleProvider
