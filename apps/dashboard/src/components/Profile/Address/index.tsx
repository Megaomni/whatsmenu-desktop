import { useContext, useInsertionEffect, useState } from 'react'
import { Col, Row, Card, Button, Container } from 'react-bootstrap'
import { AppContext } from '../../../context/app.ctx'
import { AddPlan } from '../../AddPlan'
import { AddressModal } from '../../Modals/Profile/Address'

export function ProfileAddress({ automaticModal }: { automaticModal?: boolean }) {
  const { profile, plansCategory } = useContext(AppContext)
  const [showModal, setShowModal] = useState(false)

  useInsertionEffect(() => {
    setShowModal(!!automaticModal)
  }, [automaticModal])

  return (
    <section>
      {plansCategory.every((plan) => plan === 'table') ? (
        <AddPlan
          notDefaultTitle
          plan="delivery"
          title="Seu plano atual não inclui a funcionalidade de Delivery ou de Encomendas/Agendamentos. Entre em contato com o suporte para mais Detalhes."
        />
      ) : (
        <Card>
          <Card.Body>
            <Container className="mx-0 px-0">
              <Row>
                {profile.address?.street && (
                  <Col md>
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAQ86CfA1RgY_d_stSABzYkjufYgGuKaTg&q='${profile.address?.street}+${profile.address?.number},+${profile.address?.neigborhood}+${profile.address?.city}+${profile.address?.state}'`}
                      frameBorder="0"
                      className="w-100 h-100"
                    ></iframe>
                  </Col>
                )}
                <Col md>
                  {profile.address?.street && (
                    <>
                      <h5 className="mt-3 mt-md-0">
                        <b>Endereço do restaurante</b>
                      </h5>
                      <p>
                        {profile.address?.street}, {profile.address?.number} • {profile.address?.neigborhood}
                      </p>
                      <p>CEP {profile.address?.zipcode}</p>
                      <p>
                        {profile.address?.city}/{profile.address?.state}
                      </p>
                    </>
                  )}
                  <Row>
                    <Col md="4" className="d-flex">
                      <Button className="flex-grow-1" onClick={() => setShowModal(true)}>
                        {profile.address?.street ? 'Editar endereço' : 'Adicionar Endereço'}
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Container>
          </Card.Body>
        </Card>
      )}
      <section className="modals">
        <AddressModal show={showModal} handleClose={() => setShowModal(false)} />
      </section>
    </section>
  )
}
