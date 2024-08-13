import { AxiosError, AxiosResponse } from 'axios'
import { AuthOptions, UserType } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { signOut } from 'next-auth/react'
import { api } from 'src/lib/axios'

export const options: AuthOptions = {
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    newUser: '/register',
    error: '/auth/login',
  },
  callbacks: {
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      if (token.user) {
        session.user = token.user as UserType
        delete token.login
      }
      return session
    },
    async jwt({ token, user: data }) {
      if (
        (token.user as UserType) &&
        !(token.user as UserType).v3Token &&
        !(token.user as UserType).admMode
      ) {
        token.user = null
        return token
      }

      if (data) {
        token.accessToken = (data as unknown as UserType).token
        token.user = (data as unknown as UserType)?.user as UserType
        api.defaults.headers.common.Authorization = `Bearer ${(token.user as UserType).v3Token}`
      }

      return token
    },
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
        password: { label: 'Password', type: 'password' },
        ip: { label: 'ip', type: 'hidden' },
        userAgent: { label: 'userAgent', type: 'hidden' },
        switchUser: { label: 'switchUser', type: 'hidden' },
      },

      async authorize(credentials) {
        if (credentials?.switchUser) {
          return { ...JSON.parse(credentials?.switchUser) }
        }

        try {
          const { data } = await api.post('/login', {
            email: credentials?.username,
            password: credentials?.password,
            ip: credentials?.ip,
            userAgent: credentials?.userAgent,
          })

          if (data.token) {
            return {
              token: data.v2.token,
              login: true,
              user: {
                ...data.user,
                loginDate: new Date().getTime(),
                v3Token: data.token,
              },
            }
          }
        } catch (error) {
          console.error(error)
          // generate a switch for error instance
          if (error instanceof AxiosError) {
            let errorData = error.response?.data

            // errorData = Array.isArray(errorData) ? errorData[0] : errorData
            if (
              (errorData.field && errorData.field === 'password') ||
              errorData?.errors?.at(0)?.message === 'Invalid user credentials'
            ) {
              throw new Error(encodeURIComponent('Senha ou email inválido(s)!'))
            }
            if (errorData.message) {
              throw new Error(encodeURIComponent(errorData.message))
            }
          }
        }

        return null
      },
    }),
  ],
}
