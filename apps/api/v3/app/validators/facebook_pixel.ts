import vine from '@vinejs/vine'

export const facebookPixelValidator = vine.compile(
  vine.object({
    pixel: vine.string().minLength(15).maxLength(30),
  })
)
