import axios from 'axios'
import { deleteCookie, getCookie } from 'cookies-next'
import { withAuth } from 'next-auth/middleware'
import { getSession, signOut } from 'next-auth/react'
import { NextRequest, NextResponse } from 'next/server'
import { apiRoute } from '../../utils/wm-functions'

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  //@ts-ignore
  async function middleware(req: NextRequest, res: NextResponse) {
    //@ts-ignore
    const session: Session = req.nextauth.token
    try {
      //@ts-ignore
      const cookieValue = getCookie('stripe.success.checkout', { req, res })
      if (cookieValue && req.url.includes(cookieValue as string)) {
        return NextResponse.redirect(
          new URL('/dashboard/profile', req.url)
          //@ts-ignore
        ).cookie('stripe.success.checkout', '')
      } else if (
        session &&
        session.user?.controls?.paymentInfo &&
        !req.url.includes('/dashboard/invoices')
      ) {
        // if (session.user?.controls?.paymentInfo.subscription.status !== "active") {
        //     return NextResponse.redirect(new URL('/dashboard/invoices', req.url));
        // }
      }
    } catch (error) {
      console.error(error)
    }

    if (session === null) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // if (session) {
    //     if (session?.user?.controls?.disableInvoice && req.page.name === "/dashboard/invoices") {
    //         return NextResponse.redirect(new URL("/dashboard/request", req.url))
    //     }
    // }
  }
)
