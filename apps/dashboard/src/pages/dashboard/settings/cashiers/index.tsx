import FinPasswordModal, { ModalProps } from '@components/Modals/FinPassword'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useContext, useEffect, useRef, useState } from 'react'
import { Button, Card, Col, Container, Form, Nav, Row, Tab, Table } from 'react-bootstrap'
import { HelpVideos } from '../../../../components/Modals/HelpVideos'
import { OverlaySpinner } from '../../../../components/OverlaySpinner'
import { Title } from '../../../../components/Partials/title'
import { AppContext } from '../../../../context/app.ctx'
import Bartender, { BartenderType } from '../../../../types/bartender'
import { useTranslation } from 'react-i18next'

export default function SettingsCashiers() {
  const { t } = useTranslation()
  const router = useRouter()
  const { profile, plansCategory, handleShowToast, bartenders, setBartenders } = useContext(AppContext)
  const { toggleModal, dataResponse, setDataResponse } = useContext(PaymentMethodContext)

  const [editBartender, setEditBartender] = useState<Bartender>()

  const [newBartender, setNewBartender] = useState<Partial<BartenderType>>({
    name: '',
    profileId: profile.id,
    password: '',
    status: true,
    controls: {
      type: 'cashier',
      blockedCategories: [],
      defaultCashier: false,
    },
  })

  const [showOverLaySpinner, setShowOverLaySpinner] = useState<boolean>(false)
  const [defaultTab, setDefaultTab] = useState<'bartenders'>('bartenders')
  const [modalProps, setModalProps] = useState<ModalProps>({
    dataToBeUpdated: {},
  })
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null)

  const addFeeSuccess = useRef(null)

  useEffect(() => {
    // if (!plansCategory.includes("table")) {
    //   router.push("/dashboard/request");
    // }

    if (router.query.bartender) {
      setDefaultTab('bartenders')
    }
  }, [plansCategory, router])

  useEffect(() => {
    if (!editBartender?.controls.blockedCategories) {
      setEditBartender((state) => {
        if (state) {
          return { ...state, controls: { ...state.controls, blockedCategories: [] } }
        }
        return state
      })
    }
  }, [editBartender])

  // BARTENDERS

  const handleAddBartender = async () => {
    if (newBartender.name === '' || newBartender.password === '') {
      return handleShowToast({ type: 'alert', title: t('register_operator') })
    }
    setShowOverLaySpinner(true)
    setModalProps({
      dataToBeUpdated: newBartender,
      request: { url: '/dashboard/bartender/create', method: 'POST' },
    })
    toggleModal(true)
    setShowOverLaySpinner(false)
  }

  const handleUpdateBartender = async (update: Partial<BartenderType>) => {
    if (update.name === '') {
      return handleShowToast({ type: 'alert', title: t('update_operator') })
    }
    setShowOverLaySpinner(true)
    setModalProps({
      dataToBeUpdated: editBartender,
      request: { url: '/dashboard/bartender/update', method: 'PATCH' },
    })
    toggleModal(true)
    setShowOverLaySpinner(false)
  }

  const handleDeleteBartender = async () => {
    if (editBartender) {
      setShowOverLaySpinner(true)
      setModalProps({
        dataToBeUpdated: { bartenderId: editBartender.id },
        request: { url: '/dashboard/bartender/delete', method: 'DELETE' },
      })
      toggleModal(true)
    }
    setShowOverLaySpinner(false)
  }

  useEffect(() => {
    if (updateSuccess && dataResponse !== null) {
      const { data, error } = dataResponse
      switch (modalProps.request?.method) {
        case 'POST': {
          if (!error) {
            data.password = ''
            setNewBartender({
              name: '',
              profileId: profile.id,
              password: '',
              status: true,
              controls: {
                type: 'cashier',
                blockedCategories: [],
                defaultCashier: false,
              },
            })

            setBartenders((state) => [...state, new Bartender(data)])
            setDataResponse(null)
            handleShowToast({
              type: 'success',
              title: t('create_operator'),
              content: `${data.name}, ${t('created_successfully')}.`,
            })
          } else {
            handleShowToast({
              type: 'erro',
              title: t('create_operator'),
              content: ``,
            })
          }
          break
        }
        case 'PATCH': {
          if (!error) {
            data.password = ''
            const bartender = bartenders.filter((b) => b.controls.type === 'cashier' || b.controls.defaultCashier).find((b) => b.id === data.id)
            if (bartender) {
              bartender.name = data.name
              bartender.password = data.password
              bartender.status = data.status
              bartender.controls = data.controls
              setBartenders([...bartenders])
              handleShowToast({
                type: 'success',
                title: t('edit_operator'),
                content: `${bartender.name}, ${t('changed_successfully')}.`,
              })
            }
          } else {
            handleShowToast({
              type: 'erro',
              title: t('edit_operator'),
              content: ``,
            })
          }
          break
        }
        case 'DELETE': {
          if (!error) {
            const bartender = bartenders.find((b) => b.id === dataResponse.data.id)
            setBartenders((state) => state.filter((b) => b.id !== dataResponse.data.id))
            setEditBartender(undefined)
            handleShowToast({
              type: 'success',
              title: t('delete_operator'),
              content: `${bartender?.name}, ${t('deleted_successfully_o')}.`,
            })
          } else {
            handleShowToast({
              type: 'erro',
              title: t('delete_operator'),
              content: ``,
            })
          }
          break
        }
      }
    }
  }, [updateSuccess, dataResponse])

  return (
    <>
      <Title title={t('settings')} className="mb-4" componentTitle={t('box_settings')} child={[t('cash_register')]} />
      <Tab.Container activeKey={defaultTab}>
        <Row>
          <Col sm={12}>
            <Nav variant="tabs" className="tab-nav-flex flex-row">
              <Nav.Item>
                <Nav.Link
                  disabled={!profile.id ? true : false}
                  eventKey="bartenders"
                  onClick={() => setDefaultTab('bartenders')}
                  className="position-relative"
                >
                  {t('operators')}
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="bartenders">
                <Card className="card-create">
                  <Card.Header>
                    <div className="d-flex gap-3">
                      <h4>{t('register_cashier')}</h4>
                      <div className="vr"></div>
                      <HelpVideos.Trigger
                        urls={[
                          { src: 'https://www.youtube.com/embed/viH0a8gsBHs', title: t('registering_operator') },
                          { src: 'https://www.youtube.com/embed/h1VhzXvLwWo', title: t('placing_order_operator') },
                        ]}
                      />
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Container className="mx-0 px-0">
                      <Row className="mb-3 text-nowrap w-100">
                        <Col md className="mb-1">
                          <Form.Label className="fw-bold fs-7">{t('operator_name')}</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              value={newBartender.name}
                              onChange={(e) =>
                                setNewBartender({
                                  ...newBartender,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                        </Col>
                        <Col md className="mb-1">
                          <Form.Label className="fw-bold fs-7">{t('password')}</Form.Label>
                          <Form.Control
                            type="password"
                            autoComplete="new-password"
                            value={newBartender.password}
                            onChange={(e) =>
                              setNewBartender({
                                ...newBartender,
                                password: e.target.value,
                              })
                            }
                          />
                        </Col>
                        <Col md className="mb-1 d-flex">
                          <div ref={addFeeSuccess} className="mt-auto flex-grow-1">
                            <Button
                              className="px-4 py-2 w-100"
                              onClick={() => {
                                handleAddBartender()
                              }}
                            >
                              {t('register')}
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Container>
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Header className="d-flex justify-content-between">
                    <h4>
                      {editBartender
                        ? `${t('operator')}: ${
                            bartenders
                              .filter((b) => b.controls.type === 'cashier' || b.controls.defaultCashier || b.controls.bartender)
                              .find((b) => b.id === editBartender.id)?.name
                          }`
                        : t('operators')}
                    </h4>
                  </Card.Header>
                  <Card.Body>
                    {!editBartender ? (
                      <Table className="mt-3" responsive striped bordered hover>
                        <thead>
                          <tr className="fs-7">
                            <th>{t('name')}</th>
                            <th className="col-1">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bartenders
                            .filter((b) => b.controls.type !== 'default')
                            .map((bartender) => {
                              return !bartender.deleted_at ? (
                                <tr key={bartender.id}>
                                  <td>{bartender.name}</td>
                                  <td>
                                    <Button onClick={() => setEditBartender(bartender)}>{t('edit')}</Button>
                                  </td>
                                </tr>
                              ) : null
                            })}
                        </tbody>
                      </Table>
                    ) : (
                      <>
                        <Row>
                          <Col md>
                            <Form.Label className="fw-bold fs-7">{t('name')}</Form.Label>
                            <Form.Control
                              value={editBartender.name}
                              onChange={(e) => {
                                setEditBartender({
                                  ...editBartender,
                                  name: e.target.value,
                                })
                              }}
                            />
                          </Col>
                          <Col md>
                            <Form.Label className="fw-bold fs-7">{t('password')}</Form.Label>
                            <Form.Control
                              type="password"
                              value={editBartender.password}
                              placeholder={t('change_password')}
                              onChange={(e) => {
                                setEditBartender({
                                  ...editBartender,
                                  password: e.target.value,
                                })
                              }}
                            />
                          </Col>
                        </Row>
                      </>
                    )}
                  </Card.Body>
                  {editBartender && (
                    <Card.Footer className="d-flex justify-content-between gap-2">
                      <Button
                        variant="outline-danger"
                        className="ms-1 flex-grow-1 flex-md-grow-0"
                        disabled={editBartender.controls.defaultCashier}
                        onClick={() => {
                          handleDeleteBartender()
                        }}
                      >
                        <span className="align-middle">{t('delete')}</span>
                      </Button>
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="danger" onClick={() => setEditBartender(undefined)}>
                          <span className="align-middle">{t('cancel')}</span>
                        </Button>
                        <Button variant="success" onClick={() => handleUpdateBartender(editBartender)}>
                          <span className="align-middle">{t('save')}</span>
                        </Button>
                      </div>
                    </Card.Footer>
                  )}
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
      <OverlaySpinner
        show={showOverLaySpinner}
        queryElement=".card-create"
        backgroundColor="transparent"
        backdropBlur={2}
        textSpinner={t('please_wait_n')}
        opacity={1}
        weight={10}
        width={100}
      />
      <FinPasswordModal
        request={modalProps.request}
        dataToBeUpdated={modalProps.dataToBeUpdated}
        setUpdateSuccess={setUpdateSuccess}
        showToast={false}
      />
    </>
  )
}
