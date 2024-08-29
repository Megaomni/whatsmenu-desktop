import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/globals.scss";
import "../../styles/print.scss";

import { Poppins, Open_Sans, Nunito } from 'next/font/google'
import { Metadata } from 'next'
import NextAuthSessionProvider from "src/providers/SessionProvider";

const openSans = Open_Sans({
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin']
})

const nuninto = Nunito({
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin']
})

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${openSans.className} ${nuninto.className} ${poppins.className}`}>
      <head>
        <meta httpEquiv="Content-Language" content="pt-br" />
        <link href="https://fonts.gstatic.com" rel="preconnect" />
        <link rel="icon" type="image/x-icon" href="/images/favicon.png"></link>
        <script src="https://www.youtube.com/iframe_api" defer></script>
      </head>
      <body>
        <NextAuthSessionProvider>
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}