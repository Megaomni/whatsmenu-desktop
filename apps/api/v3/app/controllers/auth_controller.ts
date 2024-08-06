import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class AuthController {
  /**
   * @login
   * @summary Login
   * @requestBody {"email": "email@example.com", "password": "xxxxxx"}
   */
  async login({ request, response }: HttpContext) {
    const { email, password, userAgent, ip } = request.all()
    let user = await User.findBy('email', email)

    try {
      if (!user) {
        return response.status(404).json({ message: 'Email inválido!' })
      }
      if (user.controls.forceSecurity) {
        return response.status(403).json({
          message: `Sua senha não é alterada há alguns meses, por motivo de segurança, crie uma nova senha clicando no link enviado para o email\n ${user.email}`,
          title: 'Sua senha do painel expirou',
          code: '403-F',
        })
      }
      if (user.controls.attempts < 5) {
        user = await User.verifyCredentials(email, password)

        const token = await User.accessTokens.create(user, ['*'], {
          name: 'dashboard_login',
        })

        user.controls.attempts = 0
        user.controls.lastAccess = { ip, userAgent, date: DateTime.local().toISO() }
        await user.save()

        return response.json({
          type: 'bearer',
          token: token.value!.release(),
          refreshToken: null,
          user: user.toJSON(),
        })
      } else {
        return response.status(403).json({ message: 'Limite de tentativas de login excedido!' })
      }
    } catch (error) {
      console.error(error)
      if (user) {
        user.controls.attempts++
        if (user.controls.attempts >= 5) {
          user.controls.lastBlock = { ip, userAgent, date: DateTime.local().toISO() }
        }
        await user.save()
      }
      if (error.code === 'E_INVALID_CREDENTIALS') {
        return response.status(404).json({ message: 'Senha inválida!' })
      }
      throw error
    }
  }

  async switchLogin({ auth, params, request, response, session }: HttpContext) {
    try {
      // await auth.logout()
      const { admId } = request.all()
      console.log(params)
      const user = await User.find(params.userId)
      if (!user) {
        return response.status(404).json({ message: 'Email inválido!' })
      }
      if (!user.controls.lastAdmAccess || !Array.isArray(user.controls.lastAdmAccess)) {
        user.controls.lastAdmAccess = []
      }

      if (user.controls.lastAdmAccess.length === 10) {
        user.controls.lastAdmAccess.pop()
      }

      user.controls.lastAdmAccess.unshift({ admId, date: DateTime.local().toISO() })

      await user.save()
      const token = await User.accessTokens.create(user, ['*'], {
        name: 'adm_access',
      })

      response.json({
        type: 'bearer',
        refreshToken: null,
        user: { ...user, admMode: true, v3Token: token.value!.release() },
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async loginApp({ request, response }: HttpContext) {
    try {
      const { email, password } = request.all()
      const user = await User.findBy('email', email)
      if (!user) {
        return response.status(403).json({ message: 'Email inválido!' })
      }
      const isSame = await hash.verify(user.password, password)
      if (!isSame) {
        return response.status(403).json({ message: 'Senha inválida!' })
      }
      return response.json({ authenticated: isSame })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async recoverPassword({ request, response }: HttpContext) {
    try {
      const { password, password_confirm, user_email } = request.all()

      const user = await User.findBy('email', user_email)

      if (!user) {
        return response.status(404).json({ message: 'Email inválido!' })
      }

      if (password === '123456' || password !== password_confirm) {
        return response.status(403).json({ message: 'Senha inválida!' })
      }

      user.password = password
      if (user.controls.recovery) {
        user.controls.recovery.token = null
      }
      user.controls.attempts = 0
      user.controls.forceSecurity = false

      await user.save()

      return response.json({ success: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async userAlterPassword({ auth, request, response }: HttpContext) {
    try {
      const { password, old_password } = request.all()
      const user = auth.user
      if (!user) {
        return response.status(404).json({ message: 'Usuário inválido!' })
      }
      // await user.load('profile')
      // const { profile } = user

      if (old_password) {
        const isSame = await hash.verify(user.password, old_password)
        if (isSame) {
          user.password = password
          user.controls.attempts = 0
          user.controls.lastUpdatePassword = DateTime.local().toISO()
          await user.save()
          // const profileTopic = Ws.getChannel('profile:*').topic(`profile:${profile.slug}`)
          // if (profileTopic) {
          //   profileTopic.broadcast(`forceLogout`, { forceLogout: true })
          //   await auth.authenticator('jwt').revokeTokens()
          // }
          return response.status(200).json(user)
        } else {
          response.status(403)
          return response.json({
            code: '403-39',
            message: 'Senha inválida',
          })
        }
      } else {
        user.password = password
        user.controls.attempts = 0
        await user.save()
      }
      // return response.json({
      //   success: true,
      //   message: 'success on alter password!'
      // })
    } catch (error) {
      console.error({
        date: DateTime.local().toISO(),
        // user: user.id,
        error: error,
      })
      response.status(500)
      response.send(error)
    }
  }

  async userAlterSecurityKey({ auth, request, response }: HttpContext) {
    try {
      const { old_security_key, security_key, recovery } = request.all()
      const user = auth.user

      if (!user || user.security_key === null) {
        return response.status(404).json({ message: 'Usuário inválido!' })
      }

      const isSame = await hash.verify(user.security_key!, old_security_key)

      if (isSame || recovery) {
        user.security_key = security_key
      } else {
        if (!security_key || old_security_key !== user.security_key) {
          return response.status(403)
        }
        user.security_key = security_key
      }

      await user.save()
      return response.json(user)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
