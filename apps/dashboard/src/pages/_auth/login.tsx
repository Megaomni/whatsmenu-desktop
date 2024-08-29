import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getCsrfToken, getSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Recover } from "../../components/Modals/Recover";
import useLocalStorage from "../../hooks/useLocalStorage";
import { useRouter } from "next/router";
import { OverlaySpinner } from "@components/OverlaySpinner";

interface SignInProps {
  csrfToken: string
  ip: string
}

function SignIn({ csrfToken, ip }: SignInProps) {
  const [showRecover, setShowRecover] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [defaultDomain, setDefaultDomain] = useLocalStorage<string | null>(
    "defaultDomain",
    null,
    "sessionStorage"
  );

  const emailRef = useRef<HTMLInputElement>(null)

  const router = useRouter();
  
  /* useEffect(() => {
        if (router.asPath.includes("error=CredentialsSignin")) {
      alert("Email ou senha inválidos")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); */

  

  // const handlerLogin = async () => {
  //   const form = document.querySelector("form");
  //   if (form) {
  //     const data = new FormData(form);
  //     try {
  //       const response = await fetch(form.action, {
  //         body: data,
  //         method: form.method,
  //       });
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }
  // };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const credentials = {
      username: e.target.username.value,
      password: e.target.password.value,
      ip: e.target.ip.value,
      userAgent: e.target.userAgent.value,
      csrfToken: e.target.csrfToken.value,
    };

    await signIn('credentials', { ...credentials, redirect: true, callbackUrl: '/dashboard/request'});
  };

  useEffect(() => {
    setDefaultDomain(null);
  }, [setDefaultDomain]);

  useEffect(() => {
    setError(router.query.error ? String(router.query.error) : '')
  }, [])

  return (
    <>
      <Head>
        <title>WhatsMenu - Login</title>
      </Head>
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
                  {error ? <div className="alert alert-danger" role="alert">
                    {error}
                  </div> : null}
                  <form onSubmit={handleSubmit}>
                    <input type="hidden" name="csrfToken" value={csrfToken} />
                    <input type="hidden" name="ip" value={ip} />
                    <input type="hidden" name="userAgent" value={navigator.userAgent} />
                    <div className="form-group first">
                      <label htmlFor="username">Email</label>
                      <input
                        ref={emailRef}
                        type="email"
                        name="username"
                        className="form-control"
                        placeholder="Email de cadastro"
                        id="username"
                        required={true}
                        defaultValue={localStorage.getItem("last-email") || ""}
                        onChange={(e) => localStorage.setItem("last-email", e.target.value)}
                      />
                    </div>
                    <div className="form-group last mb-3">
                      <label htmlFor="password">Senha</label>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Sua senha"
                        id="password"
                        required={true}
                        // onChange={() => setError('')}
                      />
                    </div>

                    <div className=" mb-5 align-items-center">
                      <p
                        className="float-start text-dark cursor-pointer"
                        onClick={() => setShowRecover(true)}
                      >
                        Esqueci a senha
                      </p>

                      {/* <Link href="/register">
                        <a className="float-end fw-bold">Registrar-se</a>
                      </Link> */}
                      <br />
                    </div>

                    <div className="d-grid gap-2">
                      <button className="btn btn-success" type="submit">
                        Acessar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Recover show={showRecover} handleClose={() => setShowRecover(false)} email={emailRef.current?.value} />
      </main>
    </>
  );
}

export default SignIn;

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  if (session?.user?.id) {
    return {
      redirect: {
        destination: "/dashboard/request",
        permanent: false,
      },
    };
  }

  const csrfToken = await getCsrfToken({ req });
  const ip = req.connection.remoteAddress

  return {
    props: { csrfToken, ip },
  };
};
