import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      return ['adm', 'manager', 'seller', 'support'].includes(
        (token as any)?.user?.controls?.type
      )
    },
  },
})
