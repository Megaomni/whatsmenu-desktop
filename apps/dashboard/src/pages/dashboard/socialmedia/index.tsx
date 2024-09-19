import Image from 'next/legacy/image'
import { readdir } from 'fs/promises'
import { GetStaticProps } from 'next'
import { Title } from '../../../components/Partials/title'
import { Button, OverlayTrigger, Popover } from 'react-bootstrap'
import { RiWhatsappFill } from 'react-icons/ri'
import { FacebookShareButton } from 'react-share'
import { BsFacebook } from 'react-icons/bs'
import { AiOutlineCopy } from 'react-icons/ai'
import { useContext } from 'react'
import { AppContext } from '../../../context/app.ctx'

interface SocialMediaProps {
  images: string[]
}

export default function SocialMedia(props: SocialMediaProps) {
  const { handleShowToast, profile } = useContext(AppContext)
  const { images } = props

  const linkShare = (link: string) => {
    return (
      <Popover id="popover-basic">
        <Popover.Header as="h3">Compartilhar</Popover.Header>
        <Popover.Body>
          <div className="d-flex gap-3">
            <a
              href={`${profile.options.linkWhatsapp ? 'whatsapp://' : 'https://api.whatsapp.com/'}send?text=${link}`}
              data-action={
                profile.options.linkWhatsapp ? 'share/whatsapp/share' : ''
              }
              rel="noreferrer"
              target="_blank"
            >
              <RiWhatsappFill
                color="green"
                size={30}
                title="Compartilhar no Whatsapp"
              />
            </a>
            <FacebookShareButton url={link} className="cursor-pointer">
              <BsFacebook
                color="blue"
                size={27}
                title="Compartilhar no Facebook"
              ></BsFacebook>
            </FacebookShareButton>
            <AiOutlineCopy
              size={30}
              className="cursor-pointer"
              title={'Copiar para o clipboard'}
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard?.writeText(link)
                  handleShowToast({
                    type: 'success',
                    title: 'Copiado',
                    content: `Link copiado com sucesso.`,
                    position: 'bottom-end',
                    flexPositionX: 'end',
                    classAdd: ' m-2 ',
                  })
                } else {
                  handleShowToast({
                    type: 'erro',
                    title: 'Copiar',
                    content: `Não foi possível copiar o link, seu navegador não tem suporte.`,
                    position: 'bottom-end',
                    flexPositionX: 'end',
                    classAdd: ' m-2 ',
                  })
                }
              }}
            />
          </div>
        </Popover.Body>
      </Popover>
    )
  }

  return (
    <>
      <Title
        title="Mídia Social"
        className="mb-4"
        componentTitle="Mídia Social"
      />
      <section>
        <div>
          <div>
            <div>
              <div>
                <p className="fs-6">
                  Para te ajudar na divulgação criamos artes para suas redes
                  sociais, não esqueça de colocar o link do cardápio nas
                  descrições dos posts.
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="social-image-container clearfix d-flex d-md-block flex-wrap">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`mx-auto ${window.innerWidth > 768 ? 'social-hover' : ''} position-relative float-md-left float-none`}
                >
                  {/* href={`/images/socialmedia/${img}`} download={img} */}
                  <div className="position-relative ">
                    <Image
                      src={`/images/socialmedia/${img}`}
                      alt=""
                      width={200}
                      height={200}
                      layout={
                        window.innerWidth > 768 ? 'responsive' : 'intrinsic'
                      }
                    />
                    <div className="position-absolute social-media-image">
                      <div
                        className="d-flex justify-content-center align-items-center position-absolute "
                        style={{ bottom: 0, left: 0, right: 0 }}
                      >
                        <Button
                          variant="link text-decoration-none"
                          as="a"
                          href={`/images/socialmedia/${img}`}
                          download={img}
                          className="flex-grow-1 image-buttons text-center text-white"
                        >
                          Baixar
                        </Button>
                        <OverlayTrigger
                          rootClose
                          trigger={'click'}
                          placement="top"
                          overlay={linkShare(
                            `${process.env.NEXT_PUBLIC_WHATSMENU_BASE_URL}/${profile.slug}?name=${img}`
                          )}
                        >
                          <Button
                            id={`button-controller-${index}`}
                            variant="link text-white"
                            className="text-decoration-none image-buttons text-center"
                          >
                            Compartilhar
                          </Button>
                        </OverlayTrigger>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const images = await readdir('./public/images/socialmedia')
  return {
    props: { images },
    revalidate: 60,
  }
}
