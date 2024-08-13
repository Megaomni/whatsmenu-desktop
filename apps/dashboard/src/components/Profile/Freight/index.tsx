import { useState, useContext, useEffect } from 'react'
import { Col, Row, Card, Form } from 'react-bootstrap'
import { KmFreight } from './KmFreight'
import { NeighborhoodFreight } from './NeighborhoodFreight'
import { AppContext } from '../../../context/app.ctx'
import {
  ProfileTaxDeliveryKM,
  ProfileTaxDeliveryNeighborhood,
} from '../../../types/profile'
import { apiRoute } from '../../../utils/wm-functions'
import { useSession } from 'next-auth/react'
import { OverlaySpinner } from '../../OverlaySpinner'
import { AddPlan } from '../../AddPlan'
import { HelpVideos } from '../../Modals/HelpVideos'
import { useTranslation } from 'react-i18next'

export function ProfileFreight() {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const {
    profile,
    plansCategory,
    setProfile,
    handleConfirmModal,
    handleShowToast,
  } = useContext(AppContext)
  const [showSpinner, setShowSpinner] = useState(false)

  const handleChangeFreight = async () => {
    setShowSpinner(true)
    const body = {
      typeDelivery: profile.typeDelivery !== 'km' ? 'km' : 'neighborhood',
    }
    try {
      const { data } = await apiRoute(
        '/dashboard/profile/taxDelivery/alter',
        session,
        'PUT',
        body
      )
      setProfile({
        ...profile,
        taxDelivery: data.taxDelivery,
        typeDelivery: data.typeDelivery,
      })
      handleShowToast({
        type: 'success',
        title: 'Tipo de Entrega',
        content: `${t('delivery_type_change_to')} ${data.typeDelivery === 'km' ? t('mile') : t('neighborhood')}`,
      })
    } catch (error) {
      handleShowToast({ type: 'erro' })
      console.error(error)
    }
    setShowSpinner(false)
  }

  return (
    <>
      <section className="position-relative">
        <OverlaySpinner
          show={showSpinner}
          textSpinner={t('loading')}
          style={{ zIndex: 99999 }}
        />
        {plansCategory.every((plan) => plan === 'table') ? (
          <AddPlan
            notDefaultTitle
            plan="delivery"
            title={t('message_plan_not_include_delivery')}
          />
        ) : (
          <>
            {profile.options.delivery.enableKm && (
              <Card>
                <Card.Header className="text-dark">
                  <h4>{t('delivery_type')}</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col
                      sm="2"
                      className="d-flex justify-content-end flex-row-reverse gap-2"
                    >
                      <Form.Label htmlFor="km">{t('by_mile')}</Form.Label>
                      <Form.Check
                        type="radio"
                        name="freightType"
                        checked={profile.typeDelivery === 'km'}
                        onChange={() => {
                          handleConfirmModal({
                            actionConfirm: () => {
                              handleChangeFreight()
                            },
                            title: `${t('reset_fees')}?`,
                            message: `${t('message_fee_deleted')}!\n${t('message_really_change_fee')}?`,
                            confirmButton: t('reset_fees'),
                            cancelButton: t('no'),
                          })
                        }}
                        id="km"
                      />
                    </Col>
                    <Col
                      sm="2"
                      className="d-flex justify-content-end flex-row-reverse gap-2"
                    >
                      <Form.Label htmlFor="neighborhood">
                        {t('by_neighborhood')}
                      </Form.Label>
                      <Form.Check
                        type="radio"
                        id="neighborhood"
                        name="freightType"
                        checked={profile.typeDelivery === 'neighborhood'}
                        onChange={() => {
                          handleConfirmModal({
                            actionConfirm: () => {
                              handleChangeFreight()
                            },
                            title: `${t('reset_fees')}?`,
                            message: `${t('message_fee_deleted')}!\n${t('message_really_change_fee')}?`,
                            confirmButton: t('reset_fees'),
                            cancelButton: t('no'),
                          })
                        }}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
            <Card>
              <Card.Header className="text-dark">
                <div className="d-flex gap-3">
                  <h4>{t('delivery_fees')}</h4>
                  <div className="vr"></div>
                  <HelpVideos.Trigger
                    urls={[
                      {
                        src: 'https://www.youtube.com/embed/0zdst312OkQ?si=xRvVnTz4ECWh2ZY6',
                        title: t('shipping_neighborhood'),
                      },
                      {
                        src: 'https://www.youtube.com/embed/7PkgbAmpJS8',
                        title: t('shipping_by_mi'),
                      },
                    ]}
                  />
                </div>
              </Card.Header>
              {profile && (
                <Card.Body>
                  {profile.typeDelivery === 'km' ? (
                    <KmFreight
                      taxDelivery={
                        profile.taxDelivery as ProfileTaxDeliveryKM[]
                      }
                    />
                  ) : (
                    <NeighborhoodFreight
                      taxDelivery={
                        profile.taxDelivery as ProfileTaxDeliveryNeighborhood[]
                      }
                    />
                  )}
                </Card.Body>
              )}
            </Card>
          </>
        )}
      </section>
    </>
  )
}
