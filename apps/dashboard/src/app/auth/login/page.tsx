import { Metadata } from "next";
import { getCsrfToken } from "next-auth/react";
import { headers } from "next/headers";
import { Login } from "./login";

export const metadata: Metadata = {
  title: 'WhatsMenu - Login',
  description: 'Página de login',
}

async function SignIn() {
  const csrfToken = await getCsrfToken()
  const userAgent = headers().get('user-agent')
  const ip = headers().get('x-real-ip') ?? headers().get('x-forwarded-for')?.split('.')[0]

  return (
    <>
      <main className="bg-white">
        <div className="d-lg-flex half">
          <div
            className="bg order-1 order-md-2 d-none d-sm-block"
            style={{ backgroundImage: "url('/images/bkg_1.webp')" }}
          ></div>
          <div className="contents order-2 order-md-1">
            <div className="container">
              <div className="row align-items-center justify-content-center">
                <div className="col-md-7">
                  <p className="fs-1">
                    <span>Login </span>
                    <strong>
                      <span className="text-green">WhatsMenu</span>
                    </strong>
                  </p>
                  <Login csrfToken={csrfToken ?? ''} ip={ip ?? ''} userAgent={userAgent ?? ''} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default SignIn;
