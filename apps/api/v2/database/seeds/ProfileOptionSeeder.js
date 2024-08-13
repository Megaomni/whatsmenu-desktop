'use strict'

/*
|--------------------------------------------------------------------------
| ProfileOptionSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Profile = use('App/Models/Profile')
const Encryption = use('Encryption')

class ProfileOptionSeeder {
  async run() {
    // const profiles = await Profile.all()
    // const optionsPackage = {
    //   active: false,
    //   shippingLocal: {
    //     active: false
    //   },
    //   shippingDelivery: {
    //     active: false
    //   },
    //   weekDistance: 3,
    //   weekDays: [
    //     {
    //       name: 'sunday',
    //       active: false,
    //     },
    //     {
    //       name: 'monday',
    //       active: false,
    //     },
    //     {
    //       name: 'tuesday',
    //       active: false,
    //     },
    //     {
    //       name: 'wednesday',
    //       active: false,
    //     },
    //     {
    //       name: 'thursday',
    //       active: false,
    //     },
    //     {
    //       name: 'friday',
    //       active: false,
    //     },
    //     {
    //       name: 'saturday',
    //       active: false,
    //     }
    //   ],
    //   specialsDates: [],
    //   maxPackage: 30,
    //   minValue: 1,
    //   minValueLocal: 1
    // }

    try {
      // for (const profile of profiles.data.rows) {

      //   // }
      //   // profiles.rows.forEach(async (profile, index) => {
      //   // profile.options.package.timePackage = {
      //   //     "active": true,
      //   //     "beforeClose": 1,
      //   //     "intervalTime": 5
      //   // }
      //   // profile.options.print.groupItems = true;
      //   // if(profile.options.package.timePackage.intervalTime == 15){
      //   //   profile.options.package.timePackage.intervalTime = 30;
      //   // }

      //   if (profile.week) {
      //     const week = JSON.parse(JSON.stringify(profile.week));

      //     for (const [weekName, value] of Object.entries(week)) {
      //       value.code = Encryption.encrypt(weekName).substring(0, 6);
      //     }
      //   }

      //   if(profile.options.package.timePackage){
      //     profile.options.package.intervalTime = profile.options.package.timePackage.intervalTime;
      //   }

      //   profile.options.package.distanceDays = {
      //     start: profile.options.package.allowPackageDay ? 0 : 1,
      //     end: profile.options.package.weekDistance * 7
      //   }

      //   profile.options.package.maxPackageHour = 1;

      //   delete profile.options.package.allowPackageDay;
      //   delete profile.options.package.timePackage;
      //   delete profile.options.package.weekDays;
      //   delete profile.options.package.weekDistance;

      //   await profile.save()
      // }

      let page = 1
      let profiles

      do {
        profiles = await Profile.query().paginate(page, 1000)

        for (const profile of profiles.rows) {
          if (typeof profile.options === 'string') {
            profile.options = JSON.parse(profile.options)
          }

          if (profile.options.package.timePackage) {
            profile.options.package.intervalTime = profile.options.package.timePackage.intervalTime
          } else {
            profile.options.package.intervalTime = 30
          }

          if (profile.options.package.allowPackageDay !== undefined && profile.options.package.weekDistance !== undefined) {
            profile.options.package.distanceDays = {
              start: profile.options.package.allowPackageDay ? 0 : 1,
              end: profile.options.package.weekDistance * 7,
            }
          } else {
            profile.options.package.distanceDays = {
              start: 0,
              end: 7,
            }
          }

          profile.options.package.week = profile.week
          profile.options.package.maxPackageHour = 1

          delete profile.options.package.allowPackageDay
          delete profile.options.package.timePackage
          delete profile.options.package.weekDays
          delete profile.options.package.weekDistance

          await profile.save()
        }

        page++
      } while (page <= profiles.pages.lastPage)
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = ProfileOptionSeeder
