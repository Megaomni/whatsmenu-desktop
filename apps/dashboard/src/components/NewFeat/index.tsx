import { AppContext } from '@context/app.ctx'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import { Alert, Card, Col, Container, Row } from 'react-bootstrap'
import { RiErrorWarningFill } from 'react-icons/ri'
import { useTranslation } from 'react-i18next'

interface FeatureType {
  name: string
  list: string[]
  day: string
}

interface NewFeatProps {
  feature: FeatureType
  mainVideo: { id: string; title: string; isMain?: boolean }
  videos: Array<{ id: string; title: string; isMain?: boolean }>
}

export const NewFeat = ({ feature, videos, mainVideo }: NewFeatProps) => {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<YT.Player[]>([])
  const [currentPlayerId, setCurrentPlayerId] = useState('')

  const generateYTVideo = (video: { id: string; title: string; isMain?: boolean }) => {
    new YT.Player(video.id, {
      height: '315px',
      width: '100%',
      videoId: video.id,
      events: {
        onReady: (event) => {
          setPlayers((state) => Array.from(new Set([...state, event.target])))
        },
        onStateChange: (e) => {
          //@ts-ignore
          if (e.target.playerInfo.playerState === 1) {
            setCurrentPlayerId(e.target.getIframe().id)
          }
        },
      },
    })
  }

  const isNextDomain = window.location.host.includes('next')

  useEffect(() => {
    mainVideo.isMain = true
    generateYTVideo(mainVideo)
    videos.forEach(generateYTVideo)
  }, [])

  useEffect(() => {
    players.filter((player) => player.getIframe().id !== currentPlayerId).forEach((player) => player.pauseVideo())
  }, [currentPlayerId])

  return (
    <Card>
      <Card.Header>{isNextDomain ? <h3>Videos {feature.name}</h3> : <h3>🚀 Prepare-se para o que há de melhor!</h3>}</Card.Header>
      <Card.Body className="overflow-auto" style={{ maxHeight: '78vh' }}>
        <Alert variant="primary" className="text-primary">
          <Row className="align-items-center mb-2">
            <Col sm="1" className="d-flex justify-content-center p-0">
              <RiErrorWarningFill size={22} />
            </Col>
            <Col sm className="p-0">
              {isNextDomain ? (
                <p className="m-0">
                  <b>
                    {t('resources')} {feature.name}
                  </b>
                </p>
              ) : (
                <p className="m-0">
                  <b>
                    {t('starting_from')} {feature.day}, o {feature.name} estará disponível no seu painel, sem custo extra! 😃 Com esta incrível
                    adição:
                  </b>
                </p>
              )}
            </Col>
          </Row>
          {feature.list.map((item) => (
            <Row key={item}>
              <Col sm="1" className="d-flex justify-content-center p-0"></Col>
              <Col sm className="p-0">
                <li>{item}</li>
              </Col>
            </Row>
          ))}
        </Alert>
        <p className="mt-4 px-3">
          Confira os vídeos abaixo para saber todos os detalhes! Estamos trazendo isso em primeira mão para você, porque merece o melhor 🌟
        </p>
        <Container fluid className="mt-4">
          <Row className="mb-4">
            <Col sm="12">
              <div className="ratio ratio-16x9">
                <div id={mainVideo.id}></div>
              </div>
            </Col>
          </Row>
          <Row>
            {videos.map(({ id }) => (
              <Col sm="4" key={id} className="mb-4">
                <div className="ratio ratio-16x9">
                  <div id={id}></div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </Card.Body>
    </Card>
  )
}
