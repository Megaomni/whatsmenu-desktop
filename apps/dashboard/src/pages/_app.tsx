import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/globals.scss";
import "../../styles/print.scss";
import i18n from "../../i18n"

import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { AppProvider } from "../context/app.ctx";

export default function MyApp({ Component, pageProps }: AppProps) {


  // useEffect(() => {
  //   const browserLanguage = navigator.language.split('-')[0]; // Pega o idioma do navegador
  //   if (!locale) {
  //     i18n.changeLanguage(browserLanguage);
  //     router.push(router.pathname, router.asPath, { locale: browserLanguage });
  //   }
  // }, [locale, router]);
  return (
    <SessionProvider session={pageProps.session} refetchInterval={0}>
      <AppProvider>
        <>
          <Component {...pageProps} />
        </>
      </AppProvider>
    </SessionProvider>
  );
}