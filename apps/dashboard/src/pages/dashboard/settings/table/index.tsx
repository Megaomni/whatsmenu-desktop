import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { ChangeEvent, FormEvent, useContext, useEffect, useRef, useState } from 'react'
import { Accordion, Button, Card, Col, Container, Form, InputGroup, ListGroup, Nav, Row, Tab, Table } from 'react-bootstrap'
import { HelpVideos } from '../../../../components/Modals/HelpVideos'
import { OverlaySpinner } from '../../../../components/OverlaySpinner'
import { Title } from '../../../../components/Partials/title'
import { Tables } from '../../../../components/Request/Tables'
import { AppContext } from '../../../../context/app.ctx'
import { TableContext } from '../../../../context/table.ctx'
import Bartender, { BartenderType } from '../../../../types/bartender'
import Category from '../../../../types/category'
import { ProfileFee } from '../../../../types/profile'
import { apiRoute, currency, hash, mask } from '../../../../utils/wm-functions'
import FinPasswordModal, { ModalProps } from '@components/Modals/FinPassword'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'

interface SettingsTablesProps {
  bartenders: BartenderType[]
}

interface BlockCategoriesProps {
  type: 'new' | 'edit'
}

export default function SettingsTables(props: SettingsTablesProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { profile, plansCategory, setProfile, handleShowToast, bartenders, setBartenders, user } = useContext(AppContext)
  const { toggleModal, dataResponse } = useContext(PaymentMethodContext)

  const [profileFees, setProfileFees] = useState<ProfileFee[]>(profile.fees)

  const [codeFee, setCodeFee] = useState<string>('')
  const [typeFee, setTypeFee] = useState<'fixed' | 'percent'>('fixed')
  const [valueFee, setValueFee] = useState<number | string>('')
  const [showAddFeeSuccess, setShowAddFeeSuccess] = useState(false)

  const [editBartender, setEditBartender] = useState<Bartender>()

  const [newBartender, setNewBartender] = useState<Partial<BartenderType>>({
    name: '',
    profileId: profile.id,
    password: '',
    status: true,
    controls: {
      type: 'default',
      blockedCategories: [],
      defaultCashier: false,
    },
  })

  const [modalProps, setModalProps] = useState<ModalProps>({
    dataToBeUpdated: {},
  })
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null)

  const [showOverLaySpinner, setShowOverLaySpinner] = useState<boolean>(false)
  const [showOverlay, setShowOverlay] = useState<boolean>(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [defaultTab, setDefaultTab] = useState<'fees' | 'bartenders' | 'tables'>('tables')

  const addFeeSuccess = useRef(null)
  const targetOverlay = useRef(null)

  useEffect(() => {
    if (!plansCategory.includes('table')) {
      router.push('/dashboard/request')
    }

    if (router.query.bartender) {
      setDefaultTab('bartenders')
    }
  }, [plansCategory, router])

  useEffect(() => {
    setProfileFees(profile.fees)
  }, [profile])

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

  // FEES
  const verifyFeeExists = (value: string) => {
    if (profileFees.find((findFee) => findFee.code?.toLowerCase() === value.toLowerCase())) {
      !showOverlay && setShowOverlay(true)
      return true
    } else {
      showOverlay && setShowOverlay(false)
      return false
    }
  }

  const handleAddFee = async () => {
    const codeInput = document.querySelector('input[name=valueTax]') as HTMLInputElement
    const valueFeeInput = document.querySelector('#valueFeeInput') as HTMLInputElement

    if (showOverlay) {
      codeInput.focus()
      return handleShowToast({
        type: 'alert',
        content: 'Já existe uma taxa com este nome.',
      })
    }

    if (!codeFee.trim().length) {
      codeInput.focus()
      return handleShowToast({
        type: 'alert',
        content: 'Nome da taxa não pode ser vázio.',
      })
    }

    if (!valueFee || (valueFee && (valueFee as number) < 0.01)) {
      valueFeeInput.focus()
      return handleShowToast({
        type: 'alert',
        content: `Insira um valor maior que ${currency({ value: 0, currency: user?.controls?.currency })}`,
      })
    }

    const newFee = {
      code: codeFee,
      type: typeFee,
      value: valueFee || 1,
      status: true,
      automatic: typeFee === 'percent',
    }

    setShowOverLaySpinner(true)

    try {
      const { data } = await apiRoute('/dashboard/fee', session, 'POST', newFee)
      setTimeout(() => {
        setCodeFee('')
        setValueFee(0)
        valueFeeInput.value = ''
        setTypeFee('fixed')
        setShowAddFeeSuccess(false)
        setProfileFees(() => [...profileFees, data])
        setProfile({ ...profile, fees: [...profileFees, data] })
        handleShowToast({
          type: 'success',
          title: 'Adicionar Taxa',
          content: `Taxa ${codeFee} criada com sucesso`,
        })
      }, 30)
    } catch (error) {
      handleShowToast({
        type: 'erro',
        title: '',
        content: ``,
      })
      console.error(error)
    }
    setShowOverLaySpinner(false)
  }

  const handleUpdateFee = async (id: number, type: 'status' | 'automatic') => {
    setShowOverLaySpinner(true)
    try {
      const body = { id, type }
      const { data } = await apiRoute('/dashboard/fee/update', session, 'PATCH', body)

      const updatedFeeIndex = profileFees.findIndex((f) => f.id === data.id)
      handleShowToast({
        type: 'success',
        title: `${type === 'status' ? 'Ativar Taxa' : 'Cobrança Automática'}`,
        content: `${profileFees[updatedFeeIndex].code}, alterado com sucesso.`,
      })

      if (updatedFeeIndex !== -1) {
        profileFees[updatedFeeIndex][type] = data[type]
      }
      setProfile({ ...profile })
    } catch (error) {
      handleShowToast({
        type: 'erro',
        title: '',
        content: ``,
      })
      console.error(error)
    }
    setShowOverLaySpinner(false)
  }

  const handleDeleteFee = async (fee: ProfileFee) => {
    setShowOverLaySpinner(true)
    try {
      const body = { fee }
      const { data } = await apiRoute('/dashboard/fee/delete', session, 'POST', body)
      handleShowToast({
        type: 'success',
        title: 'Excluir Taxa',
        content: `Taxa ${fee.code} excluida com sucesso`,
      })
      const resultFees = profileFees.filter((f) => f.id !== data.id)
      setProfileFees(() => [...resultFees])
      setProfile(() => ({ ...profile, fees: resultFees }))
    } catch (error) {
      handleShowToast({
        type: 'erro',
        title: '',
        content: ``,
      })
    }
    setShowOverLaySpinner(false)
  }

  // BARTENDERS

  const handlePersistBartender = async (e: ChangeEvent<HTMLInputElement>) => {
    setShowOverLaySpinner(true)
    const body = profile.options.table
    if (body) {
      body.persistBartender = e.target.checked
    }
    try {
      const { data } = await apiRoute('/dashboard/settings/tableConfigUpdate', session, 'PATCH', { table: body })
      setProfile({ ...profile, options: { ...profile.options, table: { ...profile.options.table, ...data } } })
    } catch (error) {
      console.error(error)
    }
    setShowOverLaySpinner(false)
  }

  const handleCallBartender = async (e: ChangeEvent<HTMLInputElement>) => {
    setShowOverLaySpinner(true)
    const body = profile.options.table
    if (body) {
      body.callBartender = e.target.checked
    }
    try {
      const { data } = await apiRoute('/dashboard/settings/tableConfigUpdate', session, 'PATCH', { table: body })
      setProfile({ ...profile, options: { ...profile.options, table: { ...profile.options.table, ...data } } })
    } catch (error) {
      console.error(error)
    }
    setShowOverLaySpinner(false)
  }

  const handleAddBartender = async () => {
    if (newBartender.name === '' || newBartender.password === '') {
      return handleShowToast({ type: 'alert', title: 'Registrar Garçom' })
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
      return handleShowToast({ type: 'alert', title: 'Atualizar Garçom' })
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
                type: 'default',
                blockedCategories: [],
                defaultCashier: false,
              },
            })

            setBartenders((state) => [...state, new Bartender(data)])
            handleShowToast({
              type: 'success',
              title: `Criar Garçom`,
              content: `${data.name}, criado com sucesso.`,
            })
          } else {
            handleShowToast({
              type: 'erro',
              title: 'Criar Garçom',
              content: ``,
            })
          }
          break
        }
        case 'PATCH': {
          if (!error) {
            data.password = ''
            const bartender = bartenders.filter((b) => b.controls.type !== 'cashier').find((b) => b.id === data.id)
            if (bartender) {
              bartender.name = data.name
              bartender.password = data.password
              bartender.status = data.status
              bartender.controls = data.controls
              setBartenders([...bartenders])
              handleShowToast({
                type: 'success',
                title: `Editar Garçom`,
                content: `${bartender.name}, alterado com sucesso.`,
              })
            }
          } else {
            handleShowToast({
              type: 'erro',
              title: 'Editar Garçom',
              content: ``,
            })
          }
          break
        }
        case 'DELETE': {
          if (!error) {
            let bartender = bartenders.filter((b) => b.controls.type !== 'cashier').find((b) => b.id === data.id)
            if (bartender) {
              setBartenders(bartenders.filter((b) => b.controls.type !== 'cashier').filter((b) => b.id !== data.id))
              setEditBartender(undefined)
              handleShowToast({
                type: 'success',
                title: `Deletar Garçom`,
                content: `${bartender.name}, excluido com sucesso.`,
              })
            }
          } else {
            handleShowToast({
              type: 'erro',
              title: 'Deletar Garçom',
              content: ``,
            })
          }
          break
        }
      }
    }
  }, [updateSuccess, dataResponse])

  const getCategories = async () => {
    if (categories.length) {
      return categories
    } else {
      try {
        const { data: menu } = await apiRoute('/dashboard/api/menu', session)
        setCategories(menu.categories)
      } catch (error) {
        handleShowToast({
          type: 'erro',
          title: 'Restringir Cardápio',
          content: `Não foi possivel obter informações do cardápio no momento, tente novamente`,
        })
        console.error(error)
      }
    }
  }

  const BlockCategories = ({ type }: BlockCategoriesProps) => {
    const [globaCheck, setGlobaCheck] = useState(true)

    const handleChangeCategoryBlocked = (e: ChangeEvent<HTMLInputElement>, category: Category) => {
      if (type === 'new' && newBartender) {
        if (e.target.checked) {
          setNewBartender({
            ...newBartender,
            controls: {
              ...newBartender.controls,
              blockedCategories: newBartender.controls.blockedCategories.filter((c: number) => c !== category.id),
            },
          })
        } else {
          setNewBartender({
            ...newBartender,
            controls: {
              ...newBartender.controls,
              blockedCategories: [...newBartender.controls.blockedCategories, category.id],
            },
          })
        }
      }
      if (type === 'edit' && editBartender) {
        if (e.target.checked) {
          setEditBartender({
            ...editBartender,
            controls: {
              ...editBartender.controls,
              blockedCategories: editBartender.controls.blockedCategories.filter((c: number) => c !== category.id),
            },
          })
        } else {
          setEditBartender({
            ...editBartender,
            controls: {
              ...editBartender.controls,
              blockedCategories: [...editBartender.controls.blockedCategories, category.id],
            },
          })
        }
      }
    }

    const checkAllCategories = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        if (type === 'new') {
          newBartender.controls.blockedCategories = []
          setNewBartender(newBartender)
        } else {
          newBartender.controls.blockedCategories = []
          setNewBartender(newBartender)
        }
      } else {
        if (type === 'new') {
          newBartender.controls.blockedCategories = categories.map((c) => c.id)
          setNewBartender(newBartender)
        } else {
          newBartender.controls.blockedCategories = categories.map((c) => c.id)
          setNewBartender(newBartender)
        }
      }
    }

    return (
      <ListGroup>
        <ListGroup.Item key={hash()} className="d-flex justify-content-end" style={{ background: '#F6F9FF' }}>
          <Form.Check
            onChange={(e) => {
              setGlobaCheck(() => e.target.checked)
              checkAllCategories(e)
            }}
            checked={globaCheck}
            id="globalCheck"
          />
        </ListGroup.Item>
        {categories.map((category) => (
          <ListGroup.Item key={category.id} className="d-flex justify-content-between">
            <span>{category.name}</span>
            <Form.Check
              checked={!(type === 'new' ? newBartender : editBartender)?.controls.blockedCategories?.includes(category.id)}
              className={`categoryCheckItem-${type}`}
              onChange={(e) => {
                handleChangeCategoryBlocked(e, category)
              }}
            />
          </ListGroup.Item>
        ))}
      </ListGroup>
    )
  }

  return (
    plansCategory.includes('table') && (
      <>
        <Title title="Configurações" className="mb-4" componentTitle="Configurações de Mesa" child={['Mesa']} />
        <Tab.Container activeKey={defaultTab}>
          <Row>
            <Col sm={12}>
              <Nav variant="tabs" className="tab-nav-flex flex-row">
                <Nav.Item>
                  <Nav.Link eventKey="tables" onClick={() => setDefaultTab('tables')} className="position-relative">
                    Mesas
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="fees" onClick={() => setDefaultTab('fees')} className="position-relative">
                    Taxas
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    disabled={!profile.id ? true : false}
                    eventKey="bartenders"
                    onClick={() => setDefaultTab('bartenders')}
                    className="position-relative"
                  >
                    Garçons
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane eventKey="tables">
                  <Tables />
                </Tab.Pane>
                <Tab.Pane eventKey="fees">
                  <Card className="card-create">
                    <Card.Header>
                      <div className="d-flex gap-3">
                        <h4>Adicionar Taxa</h4>
                        <div className='vr'></div>
                        <HelpVideos.Trigger urls={[{ src: 'https://www.youtube.com/embed/OLed3fDcCbE?si=iXdY6O-bBq5IWAQU', title: 'Criando taxas' }]} />
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Container className="mx-0 px-0">
                        <Row className="mb-3 text-nowrap">
                          <Col md className="mb-1">
                            <Form.Label className="fw-bold fs-7">Nome da taxa</Form.Label>
                            <div className="position-relative">
                              <Form.Control
                                type="text"
                                name="valueTax"
                                ref={targetOverlay}
                                value={codeFee}
                                autoComplete="false"
                                isInvalid={showOverlay}
                                style={{ zIndex: 0 }}
                                onChange={(e: FormEvent) => {
                                  const target = e.target as HTMLInputElement
                                  const value = target.value
                                  setCodeFee(value)
                                  verifyFeeExists(value)
                                }}
                              />
                              <Form.Control.Feedback tooltip type="invalid" style={{ zIndex: 0 }}>
                                Esta taxa já existe
                              </Form.Control.Feedback>
                            </div>
                          </Col>
                          <Col md className="mb-1">
                            <Form.Label className="fw-bold fs-7">Tipo de Cobrança</Form.Label>
                            <Form.Select
                              value={typeFee}
                              onChange={(e: FormEvent) => {
                                const target = e.target as HTMLInputElement
                                const targetValue = target.value as 'fixed' | 'percent'
                                setTypeFee(targetValue)
                              }}
                            >
                              <option value="fixed">Valor Fixo</option>
                              <option value="percent">Porcentagem</option>
                            </Form.Select>
                          </Col>
                          <Col md className="mb-1">
                            <div className="position-relative">
                              <Form.Label className="fw-bold mt-auto fs-7">Valor da Taxa</Form.Label>
                              <InputGroup>
                                <InputGroup.Text>
                                  {typeFee === 'percent' ? '%' : currency({ value: 0, symbol: true, currency: user?.controls?.currency })}
                                </InputGroup.Text>
                                <Form.Control
                                  type="number"
                                  id="valueFeeInput"
                                  min={1}
                                  value={valueFee}
                                  isInvalid={typeof Number(valueFee) !== 'number'}
                                  onChange={(e) => {
                                    mask(e, 'currency')
                                    if (e.target.value) {
                                      setValueFee(Number(e.target.value))
                                    } else {
                                      setValueFee(0)
                                    }
                                  }}
                                />
                              </InputGroup>
                              <Form.Control.Feedback tooltip type="invalid" style={{ zIndex: 0 }}>
                                Insira um número maior que {currency({ value: 1, currency: user?.controls?.currency })}
                              </Form.Control.Feedback>
                            </div>
                          </Col>
                          <Col md className="mb-1 d-flex">
                            <div ref={addFeeSuccess} className="mt-auto flex-grow-1">
                              <Button
                                className="px-4 py-2 w-100"
                                onClick={() => {
                                  handleAddFee()
                                }}
                              >
                                Criar
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Container>
                    </Card.Body>
                  </Card>

                  <Card className="mt-5">
                    <Card.Header>
                      <h4>Taxas</h4>
                    </Card.Header>
                    <Card.Body>
                      <Table className="mt-3" responsive striped bordered hover>
                        <thead>
                          <tr className="fs-7">
                            <th>Nome</th>
                            <th>Tipo de Cobrança</th>
                            <th>Valor</th>
                            <th>Cobrar Automaticamente</th>
                            <th className="col-2">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profileFees?.map((fee, indexFee, arrFees) => {
                            return (
                              <tr key={fee.code}>
                                <td>
                                  <span>{fee.code}</span>
                                </td>
                                <td>
                                  <span>{fee.type === 'fixed' ? 'Valor Fixo' : 'Porcentagem'}</span>
                                </td>
                                <td className="text-center">
                                  <span>
                                    {fee.type === 'fixed' ? currency({ value: fee.value, currency: user?.controls?.currency }) : `${fee.value}%`}
                                  </span>
                                </td>
                                <td>
                                  <span>
                                    <Form.Switch
                                      className="text-center"
                                      defaultChecked={fee.automatic}
                                      onChange={() => {
                                        handleUpdateFee(fee.id as number, 'automatic')
                                      }}
                                    />
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex">
                                    <Button
                                      variant="orange text-white"
                                      className="ms-1 flex-grow-1"
                                      onClick={() => {
                                        handleUpdateFee(fee.id as number, 'status')
                                      }}
                                    >
                                      <span className="align-middle">{fee.status ? 'Desativar' : 'Ativar'}</span>
                                    </Button>
                                    <Button
                                      variant="danger"
                                      className="ms-1 flex-grow-1"
                                      disabled={editBartender?.controls.defaultCashier}
                                      onClick={() => handleDeleteFee(fee)}
                                    >
                                      <span className="align-middle">Excluir</span>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Tab.Pane>
                <Tab.Pane eventKey="bartenders">
                  <Card className="card-create">
                    <Card.Header>
                      <div className="d-flex gap-3">
                        <h4>Registrar Garçom</h4>
                        <div className="vr"></div>
                        <HelpVideos.Trigger
                          urls={[
                            { src: 'https://www.youtube.com/embed/rYpj9BSBpSU', title: 'Cadastrando garçom' },
                            { src: 'https://www.youtube.com/embed/ODSwO7PAasI', title: 'Fazendo um pedido como garçom' },
                            { src: 'https://www.youtube.com/embed/gRwhs4iC5Kg', title: 'Fazendo um pedido de pizza como garçom' },
                          ]}
                        />
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Container className="mx-0 px-0">
                        <Row className="mb-3 text-nowrap w-100">
                          <Col md className="mb-1">
                            <Form.Label className="fw-bold fs-7">Nome do Garçom</Form.Label>
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
                            <Form.Label className="fw-bold fs-7">Senha</Form.Label>
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
                          <Col md>
                            <Form.Label className="fw-bold fs-7">Permissão</Form.Label>
                            <Form.Select
                              value={newBartender.controls.type ?? 'default'}
                              onChange={(e) =>
                                setNewBartender({
                                  ...newBartender,
                                  controls: {
                                    ...newBartender.controls,
                                    type: e.target.value,
                                  },
                                })
                              }
                            >
                              <option value="default">Garçom</option>
                              <option value="manager">Gerente</option>
                            </Form.Select>
                          </Col>
                          <Col md className="mb-1 d-flex">
                            <Form.Switch
                              id="newBartenderStatus"
                              label="Permitir Pedidos"
                              className="m-auto mb-2"
                              checked={newBartender.status}
                              onChange={(e) =>
                                setNewBartender({
                                  ...newBartender,
                                  status: e.target.checked,
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
                                Registrar
                              </Button>
                            </div>
                          </Col>
                        </Row>
                        <Accordion className="w-100">
                          <Accordion.Item eventKey="0">
                            <Accordion.Header className="fs-5" onClick={getCategories}>
                              Restringir Cardápio
                            </Accordion.Header>
                            <Accordion.Body className="position-relative" style={{ minHeight: '10rem' }}>
                              <OverlaySpinner show={!categories.length} textSpinner="Carregando..." />
                              {categories.length ? (
                                <>
                                  <h5 className="fw-bold">Categorias</h5>
                                  <p>Selecione quais categorias o garçom terá permissão para realizar pedidos</p>
                                  <BlockCategories type="new" />
                                </>
                              ) : null}
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      </Container>
                    </Card.Body>
                  </Card>

                  <Card>
                    <Card.Header className="d-flex justify-content-between">
                      <h4>{editBartender ? `Garçom: ${bartenders.find((b) => b.id === editBartender.id)?.name}` : 'Garçons'}</h4>
                      <div className='d-flex gap-4'>
                        <Form.Switch
                          id="callBartender"
                          checked={profile.options.table?.callBartender ?? false}
                          label={`Chamar Garçom`}
                          onChange={(e) => handleCallBartender(e)}
                        />
                        {!editBartender ? (
                          <Form.Switch
                            id="persistBartender"
                            checked={profile.options.table?.persistBartender ?? false}
                            label="Manter garçom logado"
                            onChange={(e) => handlePersistBartender(e)}
                          />
                        ) : (
                          <>
                            <Form.Switch
                              id="bartenderStatus"
                              label="Permitir Pedidos"
                              checked={editBartender.status}
                              onChange={(e) => {
                                setEditBartender({
                                  ...editBartender,
                                  status: e.target.checked,
                                })
                              }}
                            />
                          </>
                        )}
                      </div>
                    </Card.Header>
                    <Card.Body>
                      {!editBartender ? (
                        <Table className="mt-3" responsive striped bordered hover>
                          <thead>
                            <tr className="fs-7">
                              <th>Nome</th>
                              <th className="col-1">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bartenders
                              .filter((b) => b.controls.type !== 'cashier')
                              .map((bartender) => {
                                return !bartender.deleted_at ? (
                                  <tr key={bartender.id}>
                                    <td>{bartender.name}</td>
                                    <td>
                                      <Button onClick={() => setEditBartender(bartender)}>Editar</Button>
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
                              <Form.Label className="fw-bold fs-7">Nome</Form.Label>
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
                              <Form.Label className="fw-bold fs-7">Senha</Form.Label>
                              <Form.Control
                                type="password"
                                value={editBartender.password}
                                placeholder="Alterar senha"
                                onChange={(e) => {
                                  setEditBartender({
                                    ...editBartender,
                                    password: e.target.value,
                                  })
                                }}
                              />
                            </Col>
                            <Col md>
                              <Form.Label className="fw-bold fs-7">Permissão</Form.Label>
                              <Form.Select
                                value={editBartender.controls.type ?? 'default'}
                                onChange={(e) =>
                                  setEditBartender({
                                    ...editBartender,
                                    controls: {
                                      ...editBartender.controls,
                                      type: e.target.value,
                                    },
                                  })
                                }
                              >
                                <option value="default">Garçom</option>
                                <option value="manager">Gerente</option>
                              </Form.Select>
                            </Col>
                          </Row>
                          <Row className="mt-4">
                            <Col sm className="d-flex">
                              <Accordion className="w-100">
                                <Accordion.Item eventKey="0">
                                  <Accordion.Header className="fs-5" onClick={getCategories}>
                                    Restringir Cardápio
                                  </Accordion.Header>
                                  <Accordion.Body className="position-relative" style={{ minHeight: '10rem' }}>
                                    <OverlaySpinner show={!categories.length} textSpinner="Carregando..." />
                                    {categories.length ? (
                                      <>
                                        <h5 className="fw-bold">Categorias</h5>
                                        <div className="d-flex">
                                          <p>Selecione quais categorias o garçom terá permissão para realizar pedidos</p>
                                        </div>
                                        <BlockCategories type="edit" />
                                      </>
                                    ) : null}
                                  </Accordion.Body>
                                </Accordion.Item>
                              </Accordion>
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
                          <span className="align-middle">Excluir</span>
                        </Button>
                        <div className="d-flex justify-content-end gap-2">
                          <Button variant="danger" onClick={() => setEditBartender(undefined)}>
                            <span className="align-middle">Cancelar</span>
                          </Button>
                          <Button variant="success" onClick={() => handleUpdateBartender(editBartender)}>
                            <span className="align-middle">Salvar</span>
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
          textSpinner="Aguarde"
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
  )
}
