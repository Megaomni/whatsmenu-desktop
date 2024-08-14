'use strict'
const { google } = require('googleapis')
const { ServiceProvider } = require('@adonisjs/fold')
const moment = require('moment')

class GoogleProvider extends ServiceProvider {
  register() {
    async function googleAuth() {
      const auth = new google.auth.GoogleAuth({
        keyFile: 'googleSheetCredencials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      const client = await auth.getClient()
      const googleSheet = google.sheets({
        version: 'v4',
        auth: client,
      })

      return {
        auth,
        googleSheet,
      }
    }

    this.app.singleton('GoogleProvider', () => {
      return {
        sheets: {
          getRowsPlan: async (spreadsheetId, range) => {
            const { googleSheet, auth } = await googleAuth()
            const rows = await googleSheet.spreadsheets.values.get({
              auth,
              spreadsheetId,
              range,
            })
            return rows.data
          },

          addRowsPlan: async (values, spreadsheetId) => {
            const { googleSheet, auth } = await googleAuth()
            const addRows = await googleSheet.spreadsheets.values.append({
              auth,
              spreadsheetId,
              range: 'Página1',
              valueInputOption: 'USER_ENTERED',
              resource: {
                values,
              },
            })
          },

          addPaidPlan: async (spreadsheetId, range, valueFind) => {
            const { googleSheet, auth } = await googleAuth()
            const addPaidStatus = await googleSheet.spreadsheets.values.update({
              auth,
              spreadsheetId,
              range,
              valueInputOption: 'USER_ENTERED',
              resource: {
                values: [valueFind],
              },
            })
          },
        },
      }

      // console.log(addRows);
    })
  }
}

module.exports = GoogleProvider
