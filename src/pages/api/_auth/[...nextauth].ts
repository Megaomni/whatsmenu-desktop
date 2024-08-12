import NextAuth, { Session, UserType } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getSession, signOut } from 'next-auth/react'
import { apiRoute } from '../../../utils/wm-functions'
import axios, { AxiosResponse } from 'axios'

export default NextAuth({
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    newUser: '/register',
    error: '/auth/login',
  },
  callbacks: {
    // async redirect({ baseUrl }) {
    //   return `${baseUrl}/auth/verification`
    // },
    async session({ session, token, user }) {
      session.accessToken = token.accessToken as string

      if (token.user) {
        session.user = token.user as UserType
        delete token.login
        // const {data: profile} = await apiRoute('/dashboard/myprofile', session)
        // session.profile = profile;
      }

      return {
        ...session,
      }
    },
    async jwt({ token, user: data }) {
      if (data) {
        token.accessToken = (data as unknown as UserType).token
        token.user = (data as unknown as UserType)?.user as UserType
        // if ((data as unknown as UserType)?.user.v3Token) {
        //   signOut()
        // }
      } else {
        // if (!token.login && token.accessToken) {
        //   try {
        //     const { data: dataUser } = await apiRoute(`${process.env.WHATSMENU_API}/dashboard/user/getUser`, (token as Session));
        //     token.user = dataUser;
        //   } catch (error) {
        //     console.error(error);
        //   }
        // }
      }

      return token
    },
  },

  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      // The name to display on the sign in form (e.g. "Sign in with...")
      // name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
        password: { label: 'Password', type: 'password' },
        ip: { label: 'ip', type: 'hidden' },
        userAgent: { label: 'userAgent', type: 'hidden' },
        switchUser: { label: 'switchUser', type: 'hidden' },
      },

      async authorize(credentials, req) {
        if (credentials?.switchUser) {
          return { ...JSON.parse(credentials?.switchUser) }
        }

        try {
          const { data } = await axios.post(
            `${process.env.WHATSMENU_API}/login`,
            { email: credentials?.username, password: credentials?.password, ip: credentials?.ip, userAgent: credentials?.userAgent },
            {
              headers: {
                'accept': '*/*',
                'Content-Type': 'application/json',
              },
            }
          )

          if (data.token) {
            return {
              token: data.token,
              login: true,
              user: { ...data.user, loginDate: new Date().getTime() },
            }
          }
        } catch (error) {
          console.error(error)
          if (error as AxiosResponse) {
            let errorData = (error as any).response.data
            errorData = Array.isArray(errorData) ? errorData[0] : errorData
            if (errorData.field && errorData.field === 'password') {
              throw new Error(encodeURIComponent('Senha inválida'))
            }
            if (errorData.message) {
              throw new Error(encodeURIComponent(errorData.message))
            }
          }
        }

        // Return null if user data could not be retrieved
        return null
      },
    }),
  ],
})
