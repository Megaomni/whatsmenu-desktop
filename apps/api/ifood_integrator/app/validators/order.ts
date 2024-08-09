import vine from '@vinejs/vine'

export const updateOrderStatusValidator = vine.compile(
  vine.object({
    orderId: vine.string(),
    status: vine.enum([
      'PLACED',
      'CONFIRMED',
      'PREPARATION_STARTED',
      'DISPATCHED',
      'READ_TO_PICKUP',
      'CONCLUDED',
      'CANCELLED',
    ]),
    cancellationReason: vine
      .object({
        reason: vine.string(),
        cancellationCode: vine.enum([
          '501',
          '502',
          '503',
          '504',
          '505',
          '506',
          '507',
          '508',
          '509',
          '511',
          '512',
          '513',
        ]),
      })
      .optional(),
  })
)
