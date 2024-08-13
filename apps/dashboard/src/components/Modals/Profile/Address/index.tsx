import { useSession } from 'next-auth/react'
import { useContext, useEffect, useState } from 'react'
import { Button, Col, Container, Form, Modal, Row } from 'react-bootstrap'
import { AppContext } from '../../../../context/app.ctx'
import { apiRoute } from '../../../../utils/wm-functions'
import { OverlaySpinner } from '../../../OverlaySpinner'
import { ProfileAddress } from '../../../../types/profile'
import { HelpVideos } from '@components/Modals/HelpVideos'
import { useTranslation } from 'react-i18next'
import i18n from 'i18n'

interface AddressModalProps {
  show: boolean
  handleClose: () => void
  handleConfirm?: () => void
}

export function AddressModal(props: AddressModalProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { profile, setProfile, handleShowToast } = useContext(AppContext)
  const { show, handleClose } = props

  const [showSpinner, setShowSpinner] = useState(false)
  const [address, setAddress] = useState<ProfileAddress>(profile.address)
  const [invalidZipCode, setInvalidZipCode] = useState(false)

  const handleUpdateAddress = async () => {
    setShowSpinner(true)
    try {
      await apiRoute(
        '/dashboard/profile/address',
        session,
        `${profile.address?.street ? 'PATCH' : 'POST'}`,
        address
      )
      handleShowToast({
        type: 'success',
        content: ``,
        title: ``,
      })
      handleClose()
      handleShowToast({ type: 'success', title: t('address') })
      setProfile({ ...profile, address })
    } catch (error) {
      // handleShowToast({ type: "erro", title: "Endereço" })
      // console.error(error);
    }
    handleClose()
    handleShowToast({ type: 'success', title: t('address') })
    setProfile({ ...profile, address })
    setShowSpinner(false)
  }

  const getAddressApi = async () => {
    try {
      const { data } = await apiRoute(
        `https://viacep.com.br/ws/${address?.zipcode}/json/`,
        undefined,
        'GET'
      )
      if (!data.erro) {
        setAddress({
          ...address,
          street: data.logradouro,
          city: data.localidade,
          state: data.uf,
          neigborhood: data.bairro,
          complement: '',
          number: '',
        })
      } else {
        setInvalidZipCode(true)
      }
    } catch (error) {
      handleShowToast({ type: 'erro' })
      console.error(error)
    }
  }

  useEffect(() => {
    if (
      address?.zipcode?.length === 9 &&
      address?.zipcode !== profile.address?.zipcode
    ) {
      getAddressApi()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address?.zipcode])

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <OverlaySpinner
          textSpinner={t('please_wait')}
          show={showSpinner}
          style={{ zIndex: 99999 }}
        />
        <Modal.Header>
          <h3>
            <b>
              {profile.address?.street ? (
                t('edit_address')
              ) : (
                <div className="d-flex gap-3">
                  <span>{t('add_address')}</span>
                  <div className="vr"></div>
                  <HelpVideos.Trigger
                    urls={[
                      {
                        title: t('filling_establishment_address'),
                        src: 'https://www.youtube.com/embed/xvhzTd_BRZo',
                      },
                    ]}
                  />
                </div>
              )}
            </b>
          </h3>
        </Modal.Header>
        <Modal.Body>
          <Container className="mx-0 px-0">
            <Row>
              <Col md="4" className="mb-3">
                <Form.Label>
                  <b>{t('zip_code')}</b>
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    value={address?.zipcode ?? ''}
                    maxLength={9}
                    isInvalid={invalidZipCode}
                    onChange={(e) => {
                      setInvalidZipCode(false)
                      const value = e.target.value.replace(/\D/g, '')
                      switch (i18n.language) {
                        case 'pt-BR':
                          e.target.value = e.target.value.replace(
                            /(\d{5})(\d{3})/,
                            '$1-$2'
                          )
                          break
                        case 'en-US':
                          e.target.value = e.target.value.substring(0, 5)
                          e.target.value = e.target.value.replace(
                            /^(\d{5})/,
                            '$1'
                          )
                          break
                      }
                      setAddress({
                        ...address,
                        zipcode: e.target.value,
                      })
                    }}
                  />
                  <Form.Control.Feedback
                    tooltip
                    type="invalid"
                    style={{ zIndex: 0 }}
                  >
                    {t('invalid_zip_code')}
                  </Form.Control.Feedback>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md="6" className="mb-3">
                <Form.Label>
                  <b>{t('address')}</b>
                </Form.Label>
                <Form.Control
                  value={address?.street ?? ''}
                  onChange={(e) =>
                    setAddress({ ...address, street: e.target.value })
                  }
                />
              </Col>
              <Col md="3" className="mb-3">
                <Form.Label>
                  <b>{t('number')}</b>
                </Form.Label>
                <Form.Control
                  value={address?.number ?? ''}
                  onChange={(e) =>
                    setAddress({ ...address, number: e.target.value })
                  }
                />
              </Col>
              <Col md="3" className="mb-3">
                <Form.Label>
                  <b>{t('complement')}</b>
                </Form.Label>
                <Form.Control
                  value={address?.complement ?? ''}
                  onChange={(e) =>
                    setAddress({ ...address, complement: e.target.value })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col md="6" className="mb-3">
                <Form.Label>
                  <b>{t('neighborhood')}</b>
                </Form.Label>
                <Form.Control
                  value={address?.neigborhood ?? ''}
                  onChange={(e) =>
                    setAddress({ ...address, neigborhood: e.target.value })
                  }
                />
              </Col>
              <Col md="6" className="mb-3">
                <Form.Label>
                  <b>{t('city')}</b>
                </Form.Label>
                <Form.Control
                  value={address?.city ?? ''}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                />
              </Col>
            </Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              handleClose()
            }}
            variant="danger"
          >
            {t('cancel')}
          </Button>

          <Button
            variant="success"
            onClick={() => {
              handleUpdateAddress()
            }}
          >
            {t('save')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
