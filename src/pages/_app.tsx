import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/globals.scss";
import "../../styles/print.scss";

import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { AppProvider } from "../context/app.ctx";

export default function MyApp({ Component, pageProps }: AppProps) {
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