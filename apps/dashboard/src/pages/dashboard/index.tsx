import { profile } from 'console'
import { GetServerSideProps } from 'next'
import { getToken } from 'next-auth/jwt'
import { getSession, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/legacy/image'

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard - WhatsMenu</title>
      </Head>

      <section>
        <div className="pagetitle">
          <h1>Dashboard</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Dashboard</li>
            </ol>
          </nav>
        </div>
        {/* <!-- End Page Title --> */}

        <section className="info-plan">
          <div className="row">
            <div className="col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <Image
                      width={150}
                      height={100}
                      src="http://placehold.jp/ff40ff/ffffff/150x100.png"
                      className="me-3 flex-shrink-0 shadow-lg"
                      alt="..."
                    />
                    <div>
                      <h5 className="fw-bold mt-0 ">Casa da Esfiha</h5>
                      <a href=" " className="text-dark ">
                        {process.env.NEXT_PUBLIC_WHATSMENU_BASE_URL}/casa-esfiha{' '}
                      </a>{' '}
                      <br />
                      <a href="# " className="stretched-link ">
                        Conectar Domínio
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <Image
                      width={150}
                      height={100}
                      src="http://placehold.jp/ff40ff/ffffff/150x100.png"
                      className="me-3 flex-shrink-0 shadow-lg"
                      alt="..."
                    />
                    <div>
                      <h5 className="fw-bold mt-0 ">Casa da Esfiha</h5>
                      <a href=" " className="text-dark ">
                        {process.env.NEXT_PUBLIC_WHATSMENU_BASE_URL}/casa-esfiha{' '}
                      </a>{' '}
                      <br />
                      <a href="# " className="stretched-link ">
                        Conectar Domínio
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
      {/* <!-- End #main --> */}

      <a
        href="# "
        className="back-to-top d-flex align-items-center justify-content-center "
      ></a>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  return {
    props: {},
    redirect: {
      destination: '/dashboard/request',
      permanent: false,
    },
  }
}
