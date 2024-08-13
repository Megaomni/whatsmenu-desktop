import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function ImagePage() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>Whatsmenu - Divulgação</title>
        <meta property="og:image:width" content={`1080`} />
        <meta property="og:image:height" content={`1080`} />
      </Head>
      <div className="d-flex align-items-center">
        {/*eslint-disable-next-line @next/next/no-img-element*/}
        <img
          src={`/images/socialmedia/${router.query?.imageId && router.query?.imageId[1]}.jpg`}
          alt=""
          className="mx-auto"
        />
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
  query,
}) => {
  return {
    props: {
      title: params?.imageId,
    },
  }
}
