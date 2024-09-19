import vine from '@vinejs/vine'

export const googleValidator = vine.compile(
  vine.object({
    google: vine
      .string()
      .regex(/^GTM-[A-Z0-9]{6,20}$/)
      .optional(),
    googleAds: vine
      .object({
        id: vine.string().regex(/^AW-\d{20}$/),
        label: vine.string(),
      })
      .optional(),
  })
)
