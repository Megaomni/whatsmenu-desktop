import { useWhatsAppBot } from '@hooks/useWhatsAppBot'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Form, InputGroup, Row, Table } from 'react-bootstrap'
import { api } from 'src/lib/axios'
import { HelpVideos } from '../../../components/Modals/HelpVideos'
import { OverlaySpinner } from '../../../components/OverlaySpinner'
import { Title } from '../../../components/Partials/title'
import { AppContext } from '../../../context/app.ctx'
import Cupom, { CupomType } from '../../../types/cupom'
import { hash, mask } from '../../../utils/wm-functions'
import { useTranslation } from 'react-i18next'

interface CuponsProps {
  cupons: Cupom[]
}

export default function Cupons(props: CuponsProps) {
  const { t } = useTranslation()
  const { profile, plansCategory, setProfile, handleShowToast, user, currency } = useContext(AppContext)

  const [cupons, setCupons] = useState<Cupom[]>(props.cupons)
  const [cupomCode, setCupomCode] = useState<string>('')
  const [offerType, setOfferType] = useState<'value' | 'percent' | 'freight'>('value')
  const [cupomType, setCupomType] = useState<'default' | 'firstOnly'>('default')
  const [cupomValue, setCupomValue] = useState<any>(0)
  const [cupomMinValue, setCupomMinValue] = useState<any>(0)

  const [cupomCodeInvalid, setCupomCodeInvalid] = useState<boolean>(false)
  const [showOverlaySpinner, setShowOverlaySpinner] = useState<boolean>(false)
  const { storeProfile } = useWhatsAppBot()
  const router = useRouter()
  useEffect(() => {
    if (plansCategory.every((plan) => plan === 'table')) {
      router.push('/dashboard/request')
    }
  }, [plansCategory, router])

  const handleCreateCupom = async () => {
    try {
      const codeInput = document.querySelector('input[name=codeInput]') as HTMLInputElement

      if (cupomCodeInvalid || !cupomCode.trim()) {
        codeInput.focus()
        return
      }

      setShowOverlaySpinner(true)

      const cupomFirstOnlyExists = cupons.some((c) => c.firstOnly === true)
      if (cupomType === 'firstOnly' && cupomFirstOnlyExists) {
        handleShowToast({
          position: 'middle-center',
          title: t('coupon_not_created'),
          content: t('unable_create_the_coupon'),
          show: true,
        })
        setCupomType('default')
        setCupomCode('')
        setOfferType('value')
        setCupomValue(0)
        setCupomMinValue(0)
        codeInput.focus()
        setShowOverlaySpinner(false)
        return
      }

      const newCupom: CupomType = {
        profileId: profile.id,
        code: cupomCode,
        type: offerType,
        value: JSON.stringify(Number(cupomValue) || 0),
        minValue: JSON.stringify(Number(cupomMinValue) || 0),
        status: 1,
        firstOnly: cupomType === 'firstOnly',
      }

      const { data: cupomCreated } = await api.post('/dashboard/cupons', newCupom)
      if (cupomCreated.firstOnly) {
        profile.firstOnlyCupom = cupomCreated
        storeProfile(profile)
      }
      setCupons([new Cupom(cupomCreated), ...cupons])

      setTimeout(() => {
        setCupomType('default')
        setCupomCode('')
        setOfferType('value')
        setCupomValue(0)
        setCupomMinValue(0)
        codeInput.focus()
      }, 10)
    } catch (e) {
      handleShowToast({
        position: 'middle-center',
        title: 'Cupom não criado.',
        content: 'Não foi possível criar o cupom',
        show: true,
      })
    } finally {
      setTimeout(() => {
        setShowOverlaySpinner(false)
      }, 300)
    }
  }

  const handleDeleteCupom = async (cupom: Cupom) => {
    try {
      await api.delete(`/dashboard/cupons/${cupom.id}`)
      const newCupons = cupons.filter((cup) => cup.code !== cupom.code)
      setCupons(newCupons)
      if (cupom.firstOnly) {
        profile.firstOnlyCupom = undefined
        storeProfile(profile)
      }
      handleShowToast({
        type: 'success',
        title: t('delete_coupon'),
        content: `${t('coupon')} ${cupom.code} ${t('delete_coupon')}`,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro' })
    }
  }

  const handlePlayPause = async (cupom: Cupom) => {
    try {
      await api.patch(`/dashboard/cupons/${cupom.id}`)
      cupom.status = cupom.status === 0 ? 1 : 0
      if (cupom.firstOnly) {
        profile.firstOnlyCupom = cupom.status ? cupom : undefined
        storeProfile(profile)
      }
      setCupons([...cupons])
      handleShowToast({
        type: 'success',
        title: t('status_coupon'),
        content: `${t('coupon')} ${cupom.code} ${cupom.status ? t('activated') : t('disabled_o')} ${t('successfully')}`,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro' })
    }
  }

  const handleActiveDeactive = async () => {
    try {
      await api.put('/dashboard/cupons/feature')
      profile.options.activeCupom = !profile.options.activeCupom
      setProfile(profile)
      profile.firstOnlyCupom = profile.options.activeCupom ? profile.firstOnlyCupom : undefined
      storeProfile(profile)
      return handleShowToast({
        type: 'success',
        title: t('coupons'),
        content: `Cupons ${profile.options.activeCupom ? t('actives') : t('inactive')} ${t('for_orders')}`,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro' })
    }
  }

  return (
    <>
      <Title title="Cupons" className="mb-4" componentTitle={t('coupon_management')} />
      <Card id="created-cupom">
        <Card.Header>
          <Row>
            <Col md className="d-flex gap-3">
              <h4 className="m-0">{t('coupon')}</h4>
              <div className="vr"></div>
              <HelpVideos.Trigger urls={[{ src: 'https://www.youtube.com/embed/Tj--vDDbSnY?si=60a-UOfcGz1ttueV', title: t('coupons') }]} />
            </Col>
            <Col md={2} className="d-flex align-items-center">
              <Form.Switch onChange={handleActiveDeactive} checked={profile.options.activeCupom} className="fs-5" label={t('activate')} id="Ativar" />
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3 text-nowrap">
            <Col md className="mb-1">
              <Form.Label className="fw-bold mt-auto fs-7">{t('coupon_code')}</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  id="codeInput"
                  name="codeInput"
                  placeholder={t('coupon_code')}
                  value={cupomCode}
                  isInvalid={cupomCodeInvalid}
                  onChange={(e) => {
                    const target = e.target

                    if (cupons.find((cup) => cup.code.toLowerCase() === target.value.toLowerCase() && !cup.deleted_at)) {
                      !cupomCodeInvalid && setCupomCodeInvalid(true)
                    } else {
                      cupomCodeInvalid && setCupomCodeInvalid(false)
                    }

                    setCupomCode(target.value?.trim().toUpperCase())
                  }}
                />
                <Form.Control.Feedback tooltip type="invalid" style={{ zIndex: 0 }}>
                  {t('coupon_already_exists')}
                </Form.Control.Feedback>
              </div>
            </Col>
            <Col md className="mb-1">
              <Form.Label className="fw-bold mt-auto fs-7">{t('offer_type')}</Form.Label>
              <Form.Select
                value={offerType}
                onChange={(e) => {
                  const value = e.target.value as 'value' | 'percent' | 'freight'
                  setOfferType(value)
                }}
              >
                <option value="value">{t('fixed_amount_n')}</option>
                <option value="percent">{t('percentage_of')}</option>
                <option value="freight">{t('fee_shipping')}</option>
              </Form.Select>
            </Col>
            <Col md className="mb-1">
              <Form.Label className="fw-bold mt-auto fs-7">{t('coupon_type')}</Form.Label>
              <Form.Select
                value={cupomType}
                onChange={(e) => {
                  const value = e.target.value as 'default' | 'firstOnly'
                  setCupomType(value)
                }}
              >
                <option value="default">{t('standard')}</option>
                <option value="firstOnly" disabled={cupons.some((cupom) => cupom.firstOnly)}>
                  {t('first_purchase')}
                </option>
              </Form.Select>
            </Col>
            <Col md className="mb-1">
              <Form.Label className="fw-bold mt-auto fs-7">{t('discount_amount')}</Form.Label>
              <InputGroup>
                {offerType !== 'freight' && <InputGroup.Text>{offerType === 'percent' ? '%' : currency({ value: 0, symbol: true })}</InputGroup.Text>}
                <Form.Control
                  type="number"
                  value={offerType === 'freight' ? '' : cupomValue}
                  min={0}
                  disabled={offerType === 'freight'}
                  placeholder={offerType === 'freight' ? t('fee_shipping') : ''}
                  onChange={(e) => {
                    e.target.value = Number(e.target.value) < 0 ? '0' : e.target.value
                    if (offerType === 'value') {
                      mask(e, 'currency')
                    }
                    setCupomValue(e.target.value)
                  }}
                />
              </InputGroup>
            </Col>
            <Col md className="mb-1">
              <Form.Label className="fw-bold mt-auto fs-7">{t('minimum_amount')}</Form.Label>
              <InputGroup>
                <InputGroup.Text>{currency({ value: 0, symbol: true })}</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={cupomMinValue}
                  min={0}
                  onChange={(e) => {
                    mask(e, 'currency')
                    setCupomMinValue(e.target.value)
                  }}
                />
              </InputGroup>
            </Col>
            <Col md="2" className="d-flex mb-1">
              <Button className="mt-auto flex-grow-1" onClick={handleCreateCupom}>
                {t('create')}
              </Button>
            </Col>
          </Row>
        </Card.Body>
        <OverlaySpinner
          show={showOverlaySpinner}
          queryElement="#created-cupom"
          // variant="success"
          backdropBlur={0.7}
          width={100}
          weight={10}
          backgroundColor="rgba(255, 255, 255, .2)"
          textSpinner={t('please_wait_n')}
          // displaySpinner={false}
        />
      </Card>

      <Card>
        <Card.Body>
          <Table className="mt-3" responsive striped bordered hover>
            <thead>
              <tr className="fs-7">
                <th>{t('code')}</th>
                <th>{t('offer_type')}</th>
                <th>{t('coupon_type')}</th>
                <th>{t('value')}</th>
                <th>{t('minimum_amount')}</th>
                <th className="col-2">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {cupons
                .filter((c) => !c.deleted_at)
                .map((cupom) => {
                  return (
                    <tr className="fs-7" key={cupom.code + hash()}>
                      <td>
                        <span>{cupom.code}</span>
                      </td>
                      <td>
                        <span>
                          {cupom.type === 'percent' ? t('percentage_of') : cupom.type === 'value' ? t('fixed_amount_n') : t('fee_shipping')}
                        </span>
                      </td>
                      <td>
                        <span>{cupom.firstOnly ? t('first_purchase') : t('standard')}</span>
                      </td>
                      <td className="text-center">
                        <span>
                          {cupom.type === 'value'
                            ? currency({ value: Number(cupom.value || 0) })
                            : cupom.type === 'percent'
                            ? `${cupom.value}%`
                            : 'Frete Grátis'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span>{currency({ value: Number(cupom.minValue || 0) })}</span>
                      </td>
                      <td>
                        <div className="d-flex">
                          <Button
                            variant="orange text-white"
                            className="ms-1 flex-grow-1"
                            onClick={() => {
                              handlePlayPause(cupom)
                            }}
                          >
                            <span>{cupom.status === 1 ? t('pause') : t('paused')}</span>
                          </Button>
                          <Button
                            variant="danger"
                            className="ms-1 flex-grow-1"
                            onClick={() => {
                              handleDeleteCupom(cupom)
                            }}
                          >
                            {t('delete')}
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
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  api.defaults.headers.common.Authorization = `Bearer ${session?.user?.v3Token}`
  const { data: cupons } = await api.get('/dashboard/cupons')

  return {
    props: { cupons },
  }
}
