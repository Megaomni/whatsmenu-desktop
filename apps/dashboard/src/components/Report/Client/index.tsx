import {
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  InputGroup,
  OverlayTrigger,
  Popover,
  Row,
  Table as TableBs,
} from 'react-bootstrap'
import DropdownButton from 'react-bootstrap/DropdownButton'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { apiRoute, getNow } from '../../../utils/wm-functions'
import { AppContext } from '../../../context/app.ctx'
import { ReportList } from '../List'
import { useReactToPrint } from 'react-to-print'
import { DateTime } from 'luxon'
import { useSession } from 'next-auth/react'
import { OverlaySpinner } from '../../OverlaySpinner'
import Table from '../../../types/table'
import { ProfileFee } from '../../../types/profile'
import Bartender from '../../../types/bartender'
import { BsInfoCircle } from 'react-icons/bs'
import Cupom from '../../../types/cupom'
import Cart from '../../../types/cart'
import { useTranslation } from 'react-i18next'
import i18n from 'i18n'

export interface IData {
  requests: {
    total: number
    quantity: number
  }
  carts: {
    data: Cart[]
    lastPage: number
    page: number
    perPage: number
    total: number
  }
  tables: {
    data: Table[]
    lastPage: number
    page: number
    perPage: number
    total: number
  }
  years?: string[]
}
export interface IResumeData {
  canceledCount: number
  canceledTotal: number
  count: number
  total: number
  totalCarts: number
  totalTaxDelivery: number
  countDelivery: number
  feesResume: { [key: string]: number }
  feeTotal: number
  formsPaymentResume: any
  bartendersResume: any
  cuponsResume: {
    code: string
    value: number
    deleted_at: string
    type: 'value' | 'percent' | 'freight' | string
  }[]
}

interface ReportsLayoutProps {
  type: 'daily' | 'monthly'
  data: IData
  setData: Dispatch<SetStateAction<IData>>
  resume?: IResumeData
  setResume: Dispatch<SetStateAction<IResumeData | undefined>>
}

export function ReportsLayout({
  type,
  setData,
  setResume,
  ...props
}: ReportsLayoutProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { handleShowToast, plansCategory, bartenders, user, currency } =
    useContext(AppContext)
  const ref = useRef(null)

  const [filter, setFilter] = useState<'delivery' | 'table' | 'package'>(
    'delivery'
  )
  const [columnDate, setColumnDate] = useState<{
    name: string
    value: 'created_at' | 'packageDate'
  } | null>(null)
  const [date, setDate] = useState(DateTime.local().toFormat('yyyy-MM-dd'))
  const [payment, setPayment] = useState('any')
  const [searchRequest, setSearchRequest] = useState<boolean>(true)
  // const [bartenderId, setBartenderId] = useState<string | number>("any");

  const [year, setYear] = useState(
    props.data?.years && props.data?.years[props.data?.years.length - 1]
  )
  const [month, setMonth] = useState<string>(
    DateTime.local().month.toString().padStart(2, '0')
  )
  const [showSpinner, setShowSpinner] = useState(false)
  const [controlList, setControlList] = useState(false)
  const [fetchAll, setFetchAll] = useState(false)

  let title: string = ''

  if (type === 'daily') {
    title = i18n.t('dailys')
  }
  if (type === 'monthly') {
    title = i18n.t('monthlys')
  }

  const feesResume = props.resume?.feesResume

  const handlePrint = useReactToPrint({
    content: () => ref.current,
    pageStyle: `
      .notPrint {
        display: none !important;
      }
      table {
        width: 100%;
        margin-left: -2.5rem;
      }
      table tr {
        text-align: center;
      }
      table td {
        padding: 5px 0;
      }
      h6 {
        font-size: 1.5rem;
      }
      #printReport {
        margin-left: 2.5rem
      }
    `,
    copyStyles: false,
  })

  const handleGetReports = useCallback(
    async (page = 1, spinner = false) => {
      const body = {
        notValidate: true,
        filter: filter ?? 'delivery',
        columnDate: columnDate?.value ?? 'created_at',
        ...(type === 'daily' ? { date } : { month, year }),
        payment,
      }
      if (spinner) {
        setShowSpinner(true)
      }
      try {
        const { data } = await apiRoute(
          `/dashboard/report/cashier?notValidate=true`,
          session,
          'POST',
          { date, filter }
        )
        if (data) {
          setData((prevData) => {
            return {
              ...data,
              tables: data.tables && {
                ...data.tables,
                lastPage: data.tables.lastPage > 0 ? data.tables.lastPage : 1,
                data:
                  page === 1
                    ? data.tables?.data.map((t: Table) => new Table(t))
                    : [
                        ...prevData?.tables?.data,
                        ...data.tables?.data.map((t: Table) => new Table(t)),
                      ],
              },
              carts: data.carts && {
                ...data.carts,
                lastPage: data.carts.lastPage > 0 ? data.carts.lastPage : 1,
                data:
                  page === 1
                    ? data.carts.data.map((c: Cart) => new Cart(c))
                    : [
                        ...prevData.carts.data,
                        ...data.carts.data.map((c: Cart) => new Cart(c)),
                      ],
              },
            }
          })
        }
      } catch (error) {
        console.error(error)
        handleShowToast({ type: 'erro' })
      } finally {
        setShowSpinner(false)
      }
    },
    [
      date,
      filter,
      handleShowToast,
      month,
      payment,
      session,
      setData,
      type,
      year,
      columnDate,
    ]
  )

  const getResume = useCallback(async () => {
    const body = {
      notValidate: true,
      type,
      filter: filter ?? 'delivery',
      columnDate: columnDate?.value ?? 'created_at',
      payment,
      date,
      month,
      year,
    }
    try {
      const { data: resume } = await apiRoute(
        `/dashboard/report/resume`,
        session,
        'POST',
        body
      )
      if (resume) {
        setResume(() => resume)
      }
    } catch (error) {
      console.error(error)
      handleShowToast({ type: 'erro' })
    }
  }, [
    date,
    filter,
    handleShowToast,
    month,
    payment,
    session,
    setResume,
    type,
    year,
    columnDate,
  ])

  const instanceActivedDate = (
    instance: Bartender | Partial<Cupom>
  ): boolean => {
    if (instance.deleted_at) {
      if (type === 'daily') {
        return DateTime.fromISO(instance.deleted_at) >= DateTime.fromISO(date)
      }
      if (type === 'monthly') {
        if (year && month) {
          return (
            DateTime.fromISO(instance.deleted_at) >=
            DateTime.fromObject({ year: Number(year), month: Number(month) })
          )
        }
      }
    }
    return true
  }

  useEffect(() => {
    if (controlList) {
      Promise.all([handleGetReports(), getResume()]).finally(() =>
        setControlList(false)
      )
    }
  }, [controlList, filter, getResume, handleGetReports])

  useEffect(() => {
    if (props.data?.years && !year) {
      setYear(props.data?.years[props.data?.years.length - 1])
    }
    if (fetchAll) {
      setTimeout(() => {
        switch (filter) {
          case 'delivery':
          case 'package':
            if (props.data.carts.lastPage > props.data.carts.page) {
              handleGetReports(props.data.carts.page + 1)
            } else {
              getResume()
              setFetchAll(false)
            }
            break
          case 'table':
            if (props.data.tables.lastPage > props.data.tables.page) {
              console.log(props.data)
              handleGetReports(props.data.tables.page + 1)
            } else {
              setFetchAll(false)
            }
            break
          default:
            break
        }
      }, 200)
    }
  }, [props.data, year, filter, handleGetReports, fetchAll, getResume])

  useEffect(() => {
    setSearchRequest(true)
  }, [month, year, date])

  return (
    <section ref={ref} id="printReport" className="position-relative">
      <OverlaySpinner
        show={showSpinner}
        textSpinner={t('please_wait')}
        style={{ zIndex: 99999 }}
        className="notPrint"
      />
      <Card>
        <Card.Header className="notPrint">
          <h4>{t('search')}</h4>
        </Card.Header>
        <Card.Body>
          <Form className="notPrint">
            <Container fluid className="mx-0 px-0">
              <Row>
                <Col sm className="pb-2">
                  {plansCategory?.includes('basic') && (
                    <Form.Check
                      name="filter"
                      type="radio"
                      label="Delivery"
                      id="delivery"
                      defaultChecked
                      onClick={(e) => {
                        setFilter(
                          (e.target as HTMLInputElement).id as typeof filter
                        )
                        setControlList(true)
                      }}
                    />
                  )}
                  {plansCategory?.includes('table') && (
                    <Form.Check
                      name="filter"
                      type="radio"
                      label={t('table')}
                      id="table"
                      onClick={(e) => {
                        setFilter(
                          (e.target as HTMLInputElement).id as typeof filter
                        )
                        setControlList(true)
                      }}
                    />
                  )}
                  {plansCategory?.includes('package') && (
                    <Form.Check
                      name="filter"
                      type="radio"
                      label={t('package')}
                      id="package"
                      onClick={(e) => {
                        setFilter(
                          (e.target as HTMLInputElement).id as typeof filter
                        )
                        setControlList(true)
                      }}
                    />
                  )}
                </Col>
              </Row>
              <Row className="text-nowrap">
                {type === 'daily' && (
                  <>
                    <Col sm>
                      <Form.Label className="fw-bold">{t('date')}</Form.Label>
                      {filter !== 'package' ? (
                        <Form.Control
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      ) : (
                        <InputGroup>
                          <Form.Control
                            type="date"
                            max={DateTime.local().toFormat('yyyy-MM-dd')}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                          />
                          <DropdownButton
                            title={columnDate?.name ?? t('search_for')}
                          >
                            {[
                              { name: t('creation_date'), value: 'created_at' },
                              {
                                name: t('delivery_date'),
                                value: 'packageDate',
                              },
                            ].map((item) => {
                              return (
                                <Dropdown.Item
                                  key={item.name}
                                  onClick={() =>
                                    setColumnDate((old) => item as any)
                                  }
                                >
                                  {item.name}
                                </Dropdown.Item>
                              )
                            })}
                          </DropdownButton>
                        </InputGroup>
                      )}
                    </Col>
                    <Col sm>
                      <Form.Label className="fw-bold">
                        {t('payment_method')}
                      </Form.Label>
                      <Form.Select
                        value={payment}
                        onChange={(e) => setPayment(e.target.value)}
                      >
                        <option value="any">{t('all')}</option>
                        <option value="Dinheiro">{t('money')}</option>
                        <option value="Cartão">{t('card')}</option>
                        <option value="Crédito">{t('credit_card')}</option>
                        <option value="Débito">{t('debit')}</option>
                        <option value="Vale Refeição">
                          {t('meal_voucher')}
                        </option>
                        <option value="Vale Alimentação">
                          {t('food_voucher')}
                        </option>
                        <option value="Pix">Pix</option>
                        <option value="PicPay">PicPay</option>
                      </Form.Select>
                    </Col>
                  </>
                )}
                {type === 'monthly' && (
                  <>
                    <Col sm>
                      <Form.Label className="fw-bold">{t('month')}</Form.Label>
                      <Form.Select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                      >
                        <option value="01">{t('january')}</option>
                        <option value="02">{t('february')}</option>
                        <option value="03">{t('march')}</option>
                        <option value="04">{t('april')}</option>
                        <option value="05">{t('may')}</option>
                        <option value="06">{t('june')}</option>
                        <option value="07">{t('july')}</option>
                        <option value="08">{t('august')}</option>
                        <option value="09">{t('september')}</option>
                        <option value="10">{t('october')}</option>
                        <option value="11">{t('november')}</option>
                        <option value="12">{t('december')}</option>
                      </Form.Select>
                    </Col>
                    <Col sm>
                      <Form.Label className="fw-bold">{t('year')}</Form.Label>
                      <Form.Select
                        value={year ?? getNow().nowYear}
                        onChange={(e) => setYear(e.target.value)}
                      >
                        {props.data?.years?.map((y, index) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    {filter === 'package' && (
                      <Col sm>
                        <Form.Label className="fw-bold">
                          {t('search_for')}
                        </Form.Label>
                        <Form.Select
                          onChange={(e) =>
                            setColumnDate((old) => JSON.parse(e.target.value))
                          }
                        >
                          {[
                            { name: 'Data Criação', value: 'created_at' },
                            { name: 'Data Entrega', value: 'packageDate' },
                          ].map((item) => (
                            <option
                              key={item.name}
                              value={JSON.stringify(item)}
                            >
                              {item.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    )}
                    <Col sm>
                      <Form.Label className="fw-bold">
                        {t('payment_method')}
                      </Form.Label>
                      <Form.Select
                        value={payment}
                        onChange={(e) => setPayment(e.target.value)}
                      >
                        <option value="any">{t('all')}</option>
                        <option value="Dinheiro">{t('money')}</option>
                        <option value="Cartão">{t('card')}</option>
                        <option value="Crédito">{t('credit_card')}</option>
                        <option value="Débito">{t('debit')}</option>
                        <option value="Vale Refeição">
                          {t('meal_voucher')}
                        </option>
                        <option value="Vale Alimentação">
                          {t('food_voucher')}
                        </option>
                        <option value="Pix">Pix</option>
                        <option value="PicPay">PicPay</option>
                      </Form.Select>
                    </Col>
                  </>
                )}
                {/* {filter === 'table' && (
                  <Col sm>
                    <Form.Label className="fw-bold">
                      Garçom
                    </Form.Label>
                    <Form.Select
                      value={bartenderId}
                      onChange={(e) => setBartenderId(e.target.value)}
                    >
                      <option value="any">Todos</option>
                      {bartenders.map(bartender => (
                        <option key={bartender.id} value={bartender.id}>{bartender.name}</option>
                      ))}
                    </Form.Select>
                  </Col>
                )} */}
                <Col md="2" sm="6" className="d-flex mt-2 p-0">
                  <Button
                    variant="success"
                    className="flex-grow-1 mt-auto"
                    onClick={() => {
                      getResume()
                      handleGetReports()
                    }}
                  >
                    Buscar
                  </Button>
                </Col>
                <Col md="2" sm="6" className="d-flex mt-2 p-0 ps-2">
                  <Button
                    className="flex-grow-1 mt-auto"
                    disabled={fetchAll}
                    onClick={async () => {
                      if (searchRequest) {
                        getResume()
                        await handleGetReports()
                        setSearchRequest(false)
                      }

                      setFetchAll(true)
                      const intervalId = setInterval(() => {
                        setFetchAll((fetchAll) => {
                          if (fetchAll === false) {
                            handlePrint()
                            clearInterval(intervalId)
                          }

                          return fetchAll
                        })
                      }, 500)
                    }} // profile?.options.print.app ? handlePrintApp() :
                  >
                    {t('print')}
                  </Button>
                </Col>
              </Row>
            </Container>
          </Form>

          <hr className="notPrint" />
          <div className="flex-column flex-lg-row d-flex justify-content-between gap-4">
            <div className="d-flex flex-column justify-content-between flex-grow-1">
              <div className="border p-2">
                <h6>{t('summary')}:</h6>
                <p className="mb-1">
                  {t('orders')}:{' '}
                  {currency({ value: props.resume?.totalCarts ?? 0 })}{' '}
                  {filter === 'table' && (
                    <span className="ms-1">({t('no_fees')})</span>
                  )}
                </p>
                <p className="mb-1">
                  {t('number_orders')}: {props.resume?.count}
                </p>
                {filter !== 'table' && (
                  <>
                    <hr className="notPrint" />
                    <p className="mb-1">
                      {t('deliverys')}:{' '}
                      {currency({ value: props.resume?.totalTaxDelivery ?? 0 })}
                    </p>
                    <p className="mb-1">
                      {t('number_deliveries')}: {props.resume?.countDelivery}
                    </p>
                  </>
                )}
                <hr className="notPrint" />
                <div className="d-flex align-items-center mb-1">
                  <p className="m-0">
                    Total:{' '}
                    {currency({
                      value: props.resume
                        ? props.resume.total -
                          Object.values(props.resume.cuponsResume).reduce(
                            (total, cupom) => (total += cupom.value),
                            0
                          )
                        : 0,
                    })}{' '}
                    {filter === 'table' && (
                      <span className="ms-1">({t('no_fees')})</span>
                    )}
                  </p>
                  {filter !== 'table' ? (
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Popover
                          id="popover-basic"
                          style={{ minWidth: '330px' }}
                        >
                          <Popover.Body>
                            {t('total_sales_and_coupons')}
                          </Popover.Body>
                        </Popover>
                      }
                    >
                      <Button variant="none" className="px-2">
                        <BsInfoCircle size={18} />
                      </Button>
                    </OverlayTrigger>
                  ) : null}
                </div>
                <div className="text-red-500">
                  <p className="mb-1">
                    {t('total_cancelled')}:{' '}
                    {currency({ value: props.resume?.canceledTotal ?? 0 })}
                  </p>
                  <p className="mb-1">
                    {t('number_canceled_orders')}: {props.resume?.canceledCount}
                  </p>
                </div>
              </div>

              {filter === 'table' ? (
                <div>
                  <div className="border p-2">
                    <h6>{t('fees')}:</h6>
                    {feesResume && Object.keys(feesResume).length
                      ? Object.entries(feesResume).map(([code, value]) => (
                          <p key={code} className="mb-1">
                            {code}: {currency({ value })}
                          </p>
                        ))
                      : t('no_fees_period')}
                    {feesResume && Object.keys(feesResume).length ? (
                      <>
                        <hr className="notPrint" />
                        <p className="mb-1">
                          {t('total_fees')}:{' '}
                          {currency({ value: props.resume?.feeTotal || 0 })}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {filter !== 'table' && props.resume ? (
              <>
                <div
                  className="flex-grow-1 overflow-auto"
                  style={{ maxHeight: '410px' }}
                >
                  <TableBs bordered striped className="m-0">
                    <thead>
                      <tr>
                        <td
                          className="position-sticky bg-white p-0"
                          style={{ top: 0 }}
                          colSpan={3}
                        >
                          <div className="d-flex justify-content-between  p-2">
                            <div>{t('coupons')}:</div>
                            <div>
                              Total:{' '}
                              {currency({
                                value: Object.values(
                                  props.resume.cuponsResume
                                ).reduce(
                                  (total, cupom) => (total += cupom.value),
                                  0
                                ),
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(props.resume.cuponsResume).map((cupom) => {
                        switch (cupom.type) {
                          case 'value':
                            cupom.type = t('fixed_amount')
                            break
                          case 'freight':
                            cupom.type = t('fee_shipping_up')
                            break
                          case 'percent':
                            cupom.type = t('percentage_up')
                            break
                          default:
                            break
                        }
                        if (instanceActivedDate(cupom)) {
                          return (
                            <tr key={cupom.code}>
                              <td className={`text-wrap`}>
                                {cupom.deleted_at
                                  ? cupom.code.replace(
                                      cupom.code.substring(
                                        cupom.code.length - 20
                                      ),
                                      ` ${t('disabled_o')}"`
                                    )
                                  : cupom.code}
                              </td>
                              <td>{cupom.type}</td>
                              <td className={`text-wrap`}>
                                {currency({ value: cupom.value })}
                              </td>
                            </tr>
                          )
                        }
                      })}
                    </tbody>
                  </TableBs>
                </div>
              </>
            ) : null}

            {filter === 'table' && props.resume ? (
              <>
                <div className="flex-grow-1">
                  <TableBs responsive bordered striped className="m-0">
                    <thead>
                      <tr>
                        <td colSpan={2}>{t('payment_methods_n')}:</td>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(props.resume.formsPaymentResume).map(
                        (formPayment: [string, any]) => (
                          <tr
                            key={formPayment[0]}
                            className={
                              formPayment[0] === payment ? 'bg-primary' : ''
                            }
                          >
                            <td
                              className={
                                formPayment[0] === payment ? 'text-white' : ''
                              }
                            >
                              {formPayment[0]}
                            </td>
                            <td
                              className={
                                formPayment[0] === payment
                                  ? 'text-end text-white'
                                  : ' text-end'
                              }
                            >
                              {currency({ value: formPayment[1] })}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>Total:</td>
                        <td className="text-end">
                          {currency({
                            value: Object.entries(
                              props.resume.formsPaymentResume
                            ).reduce((total, formPayment: [string, any]) => {
                              return (total += formPayment[1])
                            }, 0),
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </TableBs>
                </div>
                <div
                  className="flex-grow-1 overflow-auto"
                  style={{ maxHeight: '410px' }}
                >
                  <TableBs bordered striped className="m-0">
                    <thead>
                      <tr>
                        <td
                          className="position-sticky bg-white p-0"
                          style={{ top: 0 }}
                          colSpan={2}
                        >
                          <div className="d-flex justify-content-between  p-2">
                            <div>{t('waitstaff')}:</div>
                            <div>
                              Total:{' '}
                              {currency({
                                value: (
                                  Object.values(
                                    props.resume?.bartendersResume
                                  ) as number[]
                                ).reduce((total, value) => (total += value), 0),
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      {bartenders
                        .sort((a, b) => (!a.deleted_at ? -1 : 1))
                        .map(
                          (bartender) =>
                            instanceActivedDate(bartender) && ( // props.resume?.bartendersResume[bartender.id] > 0 &&
                              <tr key={bartender.id}>
                                {' '}
                                {/* className={bartender.id === bartenderId ? 'bg-primary' : ''}*/}
                                <td className={`text-wrap`}>
                                  {' '}
                                  {/*  ${bartender.id === bartenderId ? 'text-white' : ''} */}
                                  {bartender.deleted_at
                                    ? bartender.name.replace(
                                        bartender.name.substring(
                                          bartender.name.length - 19
                                        ),
                                        ` ${t('disabled_o')}`
                                      )
                                    : bartender.name}
                                </td>
                                <td>
                                  {currency({
                                    value:
                                      props.resume?.bartendersResume[
                                        bartender.id
                                      ],
                                  })}
                                </td>{' '}
                                {/* className={bartender.id === bartenderId ? 'text-white text-end' : ' text-end'} */}
                              </tr>
                            )
                        )}
                    </tbody>
                  </TableBs>
                </div>
              </>
            ) : null}
          </div>
        </Card.Body>
      </Card>
      {props.data && (
        <ReportList
          carts={props.data?.carts}
          tables={props.data?.tables}
          title={title}
          filter={filter}
          type={type}
          getReports={handleGetReports}
          setFetchAll={setFetchAll}
          fetchAll={fetchAll}
          columnType={
            filter === 'package' ? columnDate?.value || 'created_at' : undefined
          }
          date={type === 'daily' ? date : `${month}-${year}`}
          payment={payment}
        />
      )}
    </section>
  )
}
