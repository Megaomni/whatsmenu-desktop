'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FlexPlan extends Model {
  static get connection() {
    return 'mysql_r'
  }

  static boot() {
    super.boot();


    this.addHook("afterFind", async (flexPlan) => {

      if (flexPlan.relateds && typeof flexPlan.relateds === "string") {
        flexPlan.relateds = JSON.parse(flexPlan.relateds);
      }
    });

    this.addHook("afterFetch", async (flexPlans) => {

      flexPlans.forEach(async flexPlan => {
        if(!flexPlan.relateds){
          flexPlan.relateds = await flexPlan.getPlans().fetch();
          if (flexPlan.relateds && typeof flexPlan.relateds === "string") {
            flexPlan.relateds = JSON.parse(flexPlan.relateds);
          }
        }
      })
    });
  }


  users() {
    return this.belongsToMany('App/Models/ReadOnly/Product', 'flexPlanId', 'userId', 'id', 'id').pivotTable('user_plans')
  }

  relateds() {
    return this.belongsToMany("App/Models/ReadOnly/FlexPlan", "plan_id", "plan_associated_id", "id", "id").pivotTable("related_plans");
  }

  systemProducts() {
    return this.hasMany('App/Models/ReadOnly/SystemProduct', 'id', 'plan_id');
  }
}

module.exports = FlexPlan
