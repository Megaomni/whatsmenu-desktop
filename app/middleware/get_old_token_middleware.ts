import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { apiV2 } from '../lib/axios.js'
import User from '#models/user'
import { AxiosError } from 'axios'

export default class GetOldTokenMiddleware {
  async handle({ request, response, params }: HttpContext, next: NextFn) {
    let { email, password, admId } = request.all()
    const { userId } = params

    let user
    if (!!email && !!password) {
      user = await User.findBy('email', email)
    } else if (userId) {
      user = await User.find(userId)
      if (user) {
        email = user.email
        password = user.password
      }
    }

    if (!user) {
      return response.status(404).json({ message: 'Email inválido!' })
    }

    let v2

    try {
      const { data } = await apiV2.post('/getToken', {
        userId: user.id,
        key: '@WhatsMenu*2024',
        email,
        password,
        admMode: !!admId,
      })
      v2 = data
    } catch (error) {
      console.error(error)
      if (error instanceof AxiosError) {
        if (Array.isArray(error.response?.data)) {
          return response.status(error.response?.status!).json(error.response?.data[0])
        } else {
          return response.status(error.response?.status!).json({ ...error.response?.data })
        }
      }
      throw error
    }

    if (!user.password.startsWith('$scrypt')) {
      user.password = password
      user = (await user.save()) as User
    }

    const output = await next()

    if (response.response.statusCode === 200) {
      const originalResponse = (response.content as any[])?.at(0)
      if (admId) {
        response.json({ token: v2.token, ...originalResponse })
      } else {
        response.json({ v2, ...originalResponse })
      }
    }

    return output
  }
}
