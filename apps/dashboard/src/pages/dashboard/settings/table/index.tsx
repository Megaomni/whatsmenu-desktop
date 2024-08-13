import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Accordion,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  ListGroup,
  Nav,
  Row,
  Tab,
  Table,
} from 'react-bootstrap'
import { HelpVideos } from '../../../../components/Modals/HelpVideos'
import { OverlaySpinner } from '../../../../components/OverlaySpinner'
import { Title } from '../../../../components/Partials/title'
import { Tables } from '../../../../components/Request/Tables'
import { AppContext } from '../../../../context/app.ctx'
import { TableContext } from '../../../../context/table.ctx'
import Bartender, { BartenderType } from '../../../../types/bartender'
import Category from '../../../../types/category'
import { ProfileFee } from '../../../../types/profile'
import { apiRoute, hash, mask } from '../../../../utils/wm-functions'
import FinPasswordModal, { ModalProps } from '@components/Modals/FinPassword'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import { useTranslation } from 'react-i18next'

interface SettingsTablesProps {
  bartenders: BartenderType[]
}

interface BlockCategoriesProps {
  type: 'new' | 'edit'
}

export default function SettingsTables(props: SettingsTablesProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const router = useRouter()
  const {
    profile,
    plansCategory,
    setProfile,
    handleShowToast,
    bartenders,
    setBartenders,
    user,
    currency,
  } = useContext(AppContext)
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
  const [defaultTab, setDefaultTab] = useState<
    'fees' | 'bartenders' | 'tables'
  >('tables')

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
          return {
            ...state,
            controls: { ...state.controls, blockedCategories: [] },
          }
        }
        return state
      })
    }
  }, [editBartender])

  // FEES
  const verifyFeeExists = (value: string) => {
    if (
      profileFees.find(
        (findFee) => findFee.code?.toLowerCase() === value.toLowerCase()
      )
    ) {
      !showOverlay && setShowOverlay(true)
      return true
    } else {
      showOverlay && setShowOverlay(false)
      return false
    }
  }

  const handleAddFee = async () => {
    const codeInput = document.querySelector(
      'input[name=valueTax]'
    ) as HTMLInputElement
    const valueFeeInput = document.querySelector(
      '#valueFeeInput'
    ) as HTMLInputElement

    if (showOverlay) {
      codeInput.focus()
      return handleShowToast({
        type: 'alert',
        content: t('fee_name_already_exists'),
      })
    }

    if (!codeFee.trim().length) {
      codeInput.focus()
      return handleShowToast({
        type: 'alert',
        content: t('fee_name_cannot_empty'),
      })
    }

    if (!valueFee || (valueFee && (valueFee as number) < 0.01)) {
      valueFeeInput.focus()
      return handleShowToast({
        type: 'alert',
        content: `${t('enter_value_greater_than')} ${currency({ value: 0 })}`,
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
          title: t('add_fee'),
          content: `${t('fee')} ${codeFee} ${t('created_successfully_a')}`,
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
      const { data } = await apiRoute(
        '/dashboard/fee/update',
        session,
        'PATCH',
        body
      )

      const updatedFeeIndex = profileFees.findIndex((f) => f.id === data.id)
      handleShowToast({
        type: 'success',
        title: `${type === 'status' ? t('activate_fee') : t('automatic_charge')}`,
        content: `${profileFees[updatedFeeIndex].code}, ${t('changed_successfully')}.`,
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
      const { data } = await apiRoute(
        '/dashboard/fee/delete',
        session,
        'POST',
        body
      )
      handleShowToast({
        type: 'success',
        title: t('delete_fee'),
        content: `${t('fee')} ${fee.code} ${t('deleted_successfuly')}`,
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
      const { data } = await apiRoute(
        '/dashboard/settings/tableConfigUpdate',
        session,
        'PATCH',
        { table: body }
      )
      setProfile({
        ...profile,
        options: {
          ...profile.options,
          table: { ...profile.options.table, ...data },
        },
      })
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
      const { data } = await apiRoute(
        '/dashboard/settings/tableConfigUpdate',
        session,
        'PATCH',
        { table: body }
      )
      setProfile({
        ...profile,
        options: {
          ...profile.options,
          table: { ...profile.options.table, ...data },
        },
      })
    } catch (error) {
      console.error(error)
    }
    setShowOverLaySpinner(false)
  }

  const handleAddBartender = async () => {
    if (newBartender.name === '' || newBartender.password === '') {
      return handleShowToast({ type: 'alert', title: t('register_waitstaff') })
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
      return handleShowToast({ type: 'alert', title: t('update_waitstaff') })
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
              title: t('create_waitstaff'),
              content: `${data.name}, ${t('created_successfully')}`,
            })
          } else {
            handleShowToast({
              type: 'erro',
              title: t('create_waitstaff'),
              content: ``,
            })
          }
          break
        }
        case 'PATCH': {
          if (!error) {
            data.password = ''
            const bartender = bartenders
              .filter((b) => b.controls.type !== 'cashier')
              .find((b) => b.id === data.id)
            if (bartender) {
              bartender.name = data.name
              bartender.password = data.password
              bartender.status = data.status
              bartender.controls = data.controls
              setBartenders([...bartenders])
              handleShowToast({
                type: 'success',
                title: t('edit_waitstaff'),
                content: `${bartender.name}, ${t('changed_successfully')}.`,
              })
            }
          } else {
            handleShowToast({
              type: 'erro',
              title: t('edit_waitstaff'),
              content: ``,
            })
          }
          break
        }
        case 'DELETE': {
          if (!error) {
            let bartender = bartenders
              .filter((b) => b.controls.type !== 'cashier')
              .find((b) => b.id === data.id)
            if (bartender) {
              setBartenders(
                bartenders
                  .filter((b) => b.controls.type !== 'cashier')
                  .filter((b) => b.id !== data.id)
              )
              setEditBartender(undefined)
              handleShowToast({
                type: 'success',
                title: t('delete_waitstaff'),
                content: `${bartender.name}, ${t('deleted_successfully_o')}.`,
              })
            }
          } else {
            handleShowToast({
              type: 'erro',
              title: t('delete_waitstaff'),
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
          title: t('restrict_menu'),
          content: t('unable_retrieve_menu_information'),
        })
        console.error(error)
      }
    }
  }

  const BlockCategories = ({ type }: BlockCategoriesProps) => {
    const [globaCheck, setGlobaCheck] = useState(true)

    const handleChangeCategoryBlocked = (
      e: ChangeEvent<HTMLInputElement>,
      category: Category
    ) => {
      if (type === 'new' && newBartender) {
        if (e.target.checked) {
          setNewBartender({
            ...newBartender,
            controls: {
              ...newBartender.controls,
              blockedCategories: newBartender.controls.blockedCategories.filter(
                (c: number) => c !== category.id
              ),
            },
          })
        } else {
          setNewBartender({
            ...newBartender,
            controls: {
              ...newBartender.controls,
              blockedCategories: [
                ...newBartender.controls.blockedCategories,
                category.id,
              ],
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
              blockedCategories:
                editBartender.controls.blockedCategories.filter(
                  (c: number) => c !== category.id
                ),
            },
          })
        } else {
          setEditBartender({
            ...editBartender,
            controls: {
              ...editBartender.controls,
              blockedCategories: [
                ...editBartender.controls.blockedCategories,
                category.id,
              ],
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
        <ListGroup.Item
          key={hash()}
          className="d-flex justify-content-end"
          style={{ background: '#F6F9FF' }}
        >
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
          <ListGroup.Item
            key={category.id}
            className="d-flex justify-content-between"
          >
            <span>{category.name}</span>
            <Form.Check
              checked={
                !(
                  type === 'new' ? newBartender : editBartender
                )?.controls.blockedCategories?.includes(category.id)
              }
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
        <Title
          title={t('settings')}
          className="mb-4"
          componentTitle={t('table_settings')}
          child={[t('table')]}
        />
        <Tab.Container activeKey={defaultTab}>
          <Row>
            <Col sm={12}>
              <Nav variant="tabs" className="tab-nav-flex flex-row">
                <Nav.Item>
                  <Nav.Link
                    eventKey="tables"
                    onClick={() => setDefaultTab('tables')}
                    className="position-relative"
                  >
                    {t('tables')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="fees"
                    onClick={() => setDefaultTab('fees')}
                    className="position-relative"
                  >
                    {t('fees')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    disabled={!profile.id ? true : false}
                    eventKey="bartenders"
                    onClick={() => setDefaultTab('bartenders')}
                    className="position-relative"
                  >
                    {t('waitstaff')}
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
                        <h4>{t('add_fee')}</h4>
                        <div className="vr"></div>
                        <HelpVideos.Trigger
                          urls={[
                            {
                              src: 'https://www.youtube.com/embed/OLed3fDcCbE?si=iXdY6O-bBq5IWAQU',
                              title: t('creating_fees'),
                            },
                          ]}
                        />
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Container className="mx-0 px-0">
                        <Row className="mb-3 text-nowrap">
                          <Col md className="mb-1">
                            <Form.Label className="fw-bold fs-7">
                              {t('fee_name')}
                            </Form.Label>
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
                              <Form.Control.Feedback
                                tooltip
                                type="invalid"
                                style={{ zIndex: 0 }}
                              >
                                {t('fee_already_exists')}
                              </Form.Control.Feedback>
                            </div>
                          </Col>
                          <Col md className="mb-1">
                            <Form.Label className="fw-bold fs-7">
                              {t('type_charge')}
                            </Form.Label>
                            <Form.Select
                              value={typeFee}
                              onChange={(e: FormEvent) => {
                                const target = e.target as HTMLInputElement
                                const targetValue = target.value as
                                  | 'fixed'
                                  | 'percent'
                                setTypeFee(targetValue)
                              }}
                            >
                              <option value="fixed">
                                {t('fixed_amount_n')}
                              </option>
                              <option value="percent">
                                {t('percentage_of')}
                              </option>
                            </Form.Select>
                          </Col>
                          <Col md className="mb-1">
                            <div className="position-relative">
                              <Form.Label className="fw-bold fs-7 mt-auto">
                                {t('fee_amount')}
                              </Form.Label>
                              <InputGroup>
                                <InputGroup.Text>
                                  {typeFee === 'percent'
                                    ? '%'
                                    : currency({ value: 0, symbol: true })}
                                </InputGroup.Text>
                                <Form.Control
                                  type="number"
                                  id="valueFeeInput"
                                  min={1}
                                  value={valueFee}
                                  isInvalid={
                                    typeof Number(valueFee) !== 'number'
                                  }
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
                              <Form.Control.Feedback
                                tooltip
                                type="invalid"
                                style={{ zIndex: 0 }}
                              >
                                {t('enter_number_greater_than')}{' '}
                                {currency({ value: 1 })}
                              </Form.Control.Feedback>
                            </div>
                          </Col>
                          <Col md className="d-flex mb-1">
                            <div
                              ref={addFeeSuccess}
                              className="flex-grow-1 mt-auto"
                            >
                              <Button
                                className="w-100 px-4 py-2"
                                onClick={() => {
                                  handleAddFee()
                                }}
                              >
                                {t('create')}
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Container>
                    </Card.Body>
                  </Card>

                  <Card className="mt-5">
                    <Card.Header>
                      <h4>{t('fees')}</h4>
                    </Card.Header>
                    <Card.Body>
                      <Table className="mt-3" responsive striped bordered hover>
                        <thead>
                          <tr className="fs-7">
                            <th>{t('name')}</th>
                            <th>{t('type_charge')}</th>
                            <th>{t('value')}</th>
                            <th>{t('charge_automatically')}</th>
                            <th className="col-2">{t('actions')}</th>
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
                                  <span>
                                    {fee.type === 'fixed'
                                      ? 'Valor Fixo'
                                      : t('percentage_of')}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span>
                                    {fee.type === 'fixed'
                                      ? currency({ value: fee.value })
                                      : `${fee.value}%`}
                                  </span>
                                </td>
                                <td>
                                  <span>
                                    <Form.Switch
                                      className="text-center"
                                      defaultChecked={fee.automatic}
                                      onChange={() => {
                                        handleUpdateFee(
                                          fee.id as number,
                                          'automatic'
                                        )
                                      }}
                                    />
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex">
                                    <Button
                                      variant="orange text-white"
                                      className="flex-grow-1 ms-1"
                                      onClick={() => {
                                        handleUpdateFee(
                                          fee.id as number,
                                          'status'
                                        )
                                      }}
                                    >
                                      <span className="align-middle">
                                        {fee.status
                                          ? t('deactive')
                                          : t('activate')}
                                      </span>
                                    </Button>
                                    <Button
                                      variant="danger"
                                      className="flex-grow-1 ms-1"
                                      disabled={
                                        editBartender?.controls.defaultCashier
                                      }
                                      onClick={() => handleDeleteFee(fee)}
                                    >
                                      <span className="align-middle">
                                        {t('delete')}
                                      </span>
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
                        <h4>{t('register_waitstaff')}</h4>
                        <div className="vr"></div>
                        <HelpVideos.Trigger
                          urls={[
                            {
                              src: 'https://www.youtube.com/embed/rYpj9BSBpSU',
                              title: t('registering_waitstaff'),
                            },
                            {
                              src: 'https://www.youtube.com/embed/ODSwO7PAasI',
                              title: t('placing_order_waiter'),
                            },
                            {
                              src: 'https://www.youtube.com/embed/gRwhs4iC5Kg',
                              title: t('placing_pizza_order_waiter'),
                            },
                          ]}
                        />
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Container className="mx-0 px-0">
                        <Row className="w-100 mb-3 text-nowrap">
                          <Col md className="mb-1">
                            <Form.Label className="fw-bold fs-7">
                              {t('waitstaff_name')}
                            </Form.Label>
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
                            <Form.Label className="fw-bold fs-7">
                              {t('password')}
                            </Form.Label>
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
                            <Form.Label className="fw-bold fs-7">
                              {t('permission')}
                            </Form.Label>
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
                              <option value="default">{t('waiter')}</option>
                              <option value="manager">{t('manager')}</option>
                            </Form.Select>
                          </Col>
                          <Col md className="d-flex mb-1">
                            <Form.Switch
                              id="newBartenderStatus"
                              label={t('allow_orders')}
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
                          <Col md className="d-flex mb-1">
                            <div
                              ref={addFeeSuccess}
                              className="flex-grow-1 mt-auto"
                            >
                              <Button
                                className="w-100 px-4 py-2"
                                onClick={() => {
                                  handleAddBartender()
                                }}
                              >
                                {t('register')}
                              </Button>
                            </div>
                          </Col>
                        </Row>
                        <Accordion className="w-100">
                          <Accordion.Item eventKey="0">
                            <Accordion.Header
                              className="fs-5"
                              onClick={getCategories}
                            >
                              {t('restrict_menu')}
                            </Accordion.Header>
                            <Accordion.Body
                              className="position-relative"
                              style={{ minHeight: '10rem' }}
                            >
                              <OverlaySpinner
                                show={!categories.length}
                                textSpinner={t('loading')}
                              />
                              {categories.length ? (
                                <>
                                  <h5 className="fw-bold">{t('categories')}</h5>
                                  <p>
                                    {t('select_categories_waiter_permitted')}
                                  </p>
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
                      <h4>
                        {editBartender
                          ? `${t('waiter')}: ${bartenders.find((b) => b.id === editBartender.id)?.name}`
                          : t('waitstaff')}
                      </h4>
                      <div className="d-flex gap-4">
                        <Form.Switch
                          id="callBartender"
                          checked={
                            profile.options.table?.callBartender ?? false
                          }
                          label={`${t('call_waitstaff')}`}
                          onChange={(e) => handleCallBartender(e)}
                        />
                        {!editBartender ? (
                          <Form.Switch
                            id="persistBartender"
                            checked={
                              profile.options.table?.persistBartender ?? false
                            }
                            label={t('keep_waitstaff_logged')}
                            onChange={(e) => handlePersistBartender(e)}
                          />
                        ) : (
                          <>
                            <Form.Switch
                              id="bartenderStatus"
                              label={t('allow_orders')}
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
                        <Table
                          className="mt-3"
                          responsive
                          striped
                          bordered
                          hover
                        >
                          <thead>
                            <tr className="fs-7">
                              <th>{t('name')}</th>
                              <th className="col-1">{t('actions')}</th>
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
                                      <Button
                                        onClick={() =>
                                          setEditBartender(bartender)
                                        }
                                      >
                                        {t('edit')}
                                      </Button>
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
                              <Form.Label className="fw-bold fs-7">
                                {t('name')}
                              </Form.Label>
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
                              <Form.Label className="fw-bold fs-7">
                                {t('password')}
                              </Form.Label>
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
                            <Col md>
                              <Form.Label className="fw-bold fs-7">
                                {t('permission')}
                              </Form.Label>
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
                                <option value="default">{t('waiter')}</option>
                                <option value="manager">{t('manager')}</option>
                              </Form.Select>
                            </Col>
                          </Row>
                          <Row className="mt-4">
                            <Col sm className="d-flex">
                              <Accordion className="w-100">
                                <Accordion.Item eventKey="0">
                                  <Accordion.Header
                                    className="fs-5"
                                    onClick={getCategories}
                                  >
                                    {t('restrict_menu')}
                                  </Accordion.Header>
                                  <Accordion.Body
                                    className="position-relative"
                                    style={{ minHeight: '10rem' }}
                                  >
                                    <OverlaySpinner
                                      show={!categories.length}
                                      textSpinner="Carregando..."
                                    />
                                    {categories.length ? (
                                      <>
                                        <h5 className="fw-bold">
                                          {t('categories')}
                                        </h5>
                                        <div className="d-flex">
                                          <p>
                                            {t(
                                              'select_categories_waiter_permitted'
                                            )}
                                          </p>
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
                          className="flex-grow-1 flex-md-grow-0 ms-1"
                          disabled={editBartender.controls.defaultCashier}
                          onClick={() => {
                            handleDeleteBartender()
                          }}
                        >
                          <span className="align-middle">{t('delete')}</span>
                        </Button>
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="danger"
                            onClick={() => setEditBartender(undefined)}
                          >
                            <span className="align-middle">{t('cancel')}</span>
                          </Button>
                          <Button
                            variant="success"
                            onClick={() => handleUpdateBartender(editBartender)}
                          >
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
  )
}
