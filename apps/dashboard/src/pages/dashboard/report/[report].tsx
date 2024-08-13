import { DateTime } from 'luxon'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { Button, Card, Table as TableBS } from 'react-bootstrap'
import { Title } from '../../../components/Partials/title'
import { CashierReport } from '../../../components/Report/CashierReports'
import { ReportGraphics } from '../../../components/Report/Graphics'
import { IResumeData, ReportsLayout } from '../../../components/Report/Layout'
import { AppContext } from '../../../context/app.ctx'
import Cart, { CartType } from '../../../types/cart'
import Table from '../../../types/table'
import { apiRoute } from '../../../utils/wm-functions'
import AuthReport from './_auth'
import { MotoboyReport } from '@components/MotoboyReport'
import { BsFillHandIndexThumbFill } from 'react-icons/bs'
import { BestSellersReport } from '@components/BestSellersReport'
import { ClientReport } from '@components/ClientReport'
import { CartsContext } from '@context/cart.ctx'
import { HelpVideos } from '@components/Modals/HelpVideos'
import { useTranslation } from 'react-i18next'

export type ReportType =
  | 'finance'
  | 'monthly'
  | 'daily'
  | 'cashier'
  | 'motoboys'
  | 'bestSellers'
  | 'client'
interface ReportProps {
  report: ReportType
  isValid: boolean
  data?: any
  resume?: any
}

export default function Report({ report, isValid, ...props }: ReportProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: session } = useSession()
  const { handleShowToast } = useContext(AppContext)
  const { motoboys } = useContext(CartsContext)

  const [validation, setValidation] = useState(false)
  const [data, setData] = useState<any>()
  const [resume, setResume] = useState<IResumeData | undefined | any>(
    props.resume
  )
  const [initialFetched, setInitialFetched] = useState(false)

  useEffect(() => {
    setValidation(false)
  }, [report])

  useEffect(() => {
    if (isValid && !initialFetched) {
      const initialRequest = async () => {
        const body: any = {
          notValidate: isValid,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        }

        try {
          if (report === 'motoboys' && !motoboys.length) {
            return
          }
          if (report === 'motoboys') {
            body.motoboyId = motoboys[0].id
          }
          setInitialFetched(true)
          const { data: dataFetched } = await apiRoute(
            `/dashboard/report/${report}/${report !== 'finance' && report !== 'cashier' ? 1 : ''}`,
            session,
            'POST',
            { ...body }
          )

          if (dataFetched) {
            if (dataFetched.carts) {
              dataFetched.carts.data = dataFetched.carts.data.map(
                (c: CartType) => new Cart(c)
              )
            }

            if (dataFetched.tables) {
              dataFetched.tables.data = dataFetched.tables.data.map(
                (t: Table) => new Table(t)
              )
            }
            setData(() => dataFetched)
          }

          if (report !== 'finance' && report !== 'motoboys') {
            const { data: resumeFetched } = await apiRoute(
              `/dashboard/report/resume`,
              session,
              'POST',
              {
                notValidate: isValid,
                type: report,
                filter: 'delivery',
                date: DateTime.local().toFormat('yyyy-MM-dd'),
              }
            )
            if (resumeFetched) {
              setResume(() => resumeFetched)
            }
          }
        } catch (error) {
          console.error(error)
          return handleShowToast({
            type: 'erro',
            title: '',
            content: '',
          })
        }
      }
      initialRequest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath, motoboys])
  if (isValid || validation) {
    // if (true) {
    switch (report) {
      case 'finance':
        return (
          <>
            <Title
              title={t('financial_report')}
              componentTitle={t('financial')}
              className="mb-4"
            />
            <div className="d-flex align-self-end mb-3">
              <HelpVideos.Trigger
                urls={[
                  {
                    src: 'https://www.youtube.com/embed/oYUhPHihzq0',
                    title: t('financial_report'),
                  },
                ]}
                className="ms-auto"
              />
            </div>
            <Card>
              <Card.Header>
                <h4>{t('summary_last_days')}</h4>
              </Card.Header>
              <Card.Body>
                <Link href="" legacyBehavior>
                  <Button
                    className="text-decoration-underline fw-bold text-wrap"
                    variant="link-dark"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(
                        '/dashboard/report/daily?notValidate=true',
                        '/dashboard/report/daily'
                      )
                    }}
                  >
                    {t('click_here_view_details')}!
                  </Button>
                </Link>
                <hr />
                <ReportGraphics type="monthly" monthly={data?.monthly} />
              </Card.Body>
            </Card>
            <br />
            <Card>
              <Card.Header>
                <h4>{t('summary_last_months')}</h4>
              </Card.Header>
              <Card.Body>
                <Link
                  href="/dashboard/report/monthly?notValidate"
                  legacyBehavior
                >
                  <Button
                    className="text-decoration-underline fw-bold text-wrap"
                    variant="link-dark"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(
                        '/dashboard/report/monthly?notValidate=true',
                        '/dashboard/report/monthly'
                      )
                    }}
                  >
                    {t('click_here_view_details')}!
                  </Button>
                </Link>
                <hr />
                <ReportGraphics type="yearly" yearly={data?.yearly} />
              </Card.Body>
            </Card>
          </>
        )
      case 'daily':
        return (
          <>
            <Title
              title={t('daily_orders')}
              componentTitle={t('daily_orders_report')}
              className="mb-4"
            />
            <ReportsLayout
              setData={setData}
              data={data}
              setResume={setResume}
              resume={resume}
              type={report}
            />
          </>
        )
      case 'monthly':
        return (
          <>
            <Title
              title={t('monthly_orders')}
              componentTitle={t('monthly_orders_report')}
              className="mb-4"
            />
            <ReportsLayout
              setData={setData}
              data={data}
              setResume={setResume}
              resume={resume}
              type={report}
            />
          </>
        )
      case 'cashier':
        return (
          <>
            <Title
              title={t('box_closures')}
              componentTitle={t('box_report')}
              className="mb-4"
            />
            <CashierReport bartenders={data?.bartenders} />
            {/* <ReportsLayout setData={setData} data={data} setResume={setResume} resume={resume} type={report} /> */}
          </>
        )
      case 'motoboys':
        return (
          <>
            <MotoboyReport
              data={data}
              isValid={true}
              setData={setData}
              resume={resume}
              report={report}
            />
          </>
        )

      case 'client':
        return (
          <>
            <Title
              title={t('customer_report_v2')}
              componentTitle={t('customer_report_v2')}
              className="mb-4"
            />
            <ClientReport clients={data} setClients={setData} isValid={true} />
          </>
        )
      case 'bestSellers':
        return (
          <>
            <Title
              title={t('best_selling_report')}
              componentTitle={t('best_sellers_v2')}
              className="mb-4"
            />
            <BestSellersReport
              isValid={true}
              report={report}
              data={data}
              setData={setData}
            />
          </>
        )
    }
  }
  return (
    <AuthReport
      report={report}
      setData={setData}
      setResume={setResume}
      setValidation={setValidation}
    />
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
  query,
  req,
}) => {
  const session = await getSession({ req })
  if (!params) {
    return {
      props: {},
    }
  }

  const { report } = params
  let isValid = !!query.notValidate
  const notValidate = session?.user?.admMode
  if (notValidate) {
    isValid = notValidate as boolean
  }

  return {
    props: {
      report,
      isValid,
    },
  }
}
