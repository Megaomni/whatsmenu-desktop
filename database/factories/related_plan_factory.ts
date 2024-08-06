import factory from '@adonisjs/lucid/factories'
import RelatedPlan from '#models/related_plan'

export const RelatedPlanFactory = factory
  .define(RelatedPlan, async ({ faker }) => {
    return {}
  })
  .build()
