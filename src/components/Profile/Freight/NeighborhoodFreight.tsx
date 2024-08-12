import { AxiosError } from 'axios'
import { useSession } from 'next-auth/react'
import { useContext, useEffect, useState } from 'react'
import { Button, Col, Container, Form, InputGroup, Row, Table } from 'react-bootstrap'
import { AppContext } from '../../../context/app.ctx'
import { apiRoute, hash, mask } from '../../../utils/wm-functions'
import { OverlaySpinner } from '../../OverlaySpinner'
import { useTranslation } from 'react-i18next'
import { ProfileTaxDeliveryNeighborhood, ProfileTaxDeliveryNeighborhoodItem } from '../../../types/profile'

interface NeighborhoodFreightProps {
  taxDelivery: ProfileTaxDeliveryNeighborhood[]
}

export function NeighborhoodFreight(props: NeighborhoodFreightProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { profile, setProfile, handleShowToast, handleConfirmModal, user, currency } = useContext(AppContext)
  let { taxDelivery } = props

  const [newTax, setNewTax] = useState<ProfileTaxDeliveryNeighborhood>({
    city: profile.address.city,
    code: hash(),
    neighborhoods: [],
  })

  const [showSpinner, setShowSpinner] = useState(false)

  const [newNeighborhood, setNewNeighborhood] = useState<ProfileTaxDeliveryNeighborhoodItem>({
    code: hash(),
    name: '',
    time: '',
    value: 0,
  })

  useEffect(() => {
    setNewTax({ ...newTax, city: profile.address.city })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.address.city])

  const handleCheckCity = (city: string) => {
    const haveCity = taxDelivery.find((tax) => tax.city === city)
    if (haveCity) {
      setNewTax(haveCity)
    } else {
      setNewTax({
        city,
        code: hash(),
        neighborhoods: [],
      })
    }
  }

  const handleAddTax = async () => {
    setShowSpinner(true)
    const city = taxDelivery.find((tax) => tax.city === newTax.city)
    const neighborhoodAlreadyExists = city?.neighborhoods.find((n) => n.name === newNeighborhood.name)
    newNeighborhood.value = Number(newNeighborhood.value) < 0 ? '0' : newNeighborhood.value
    if (!newNeighborhood.time) {
      newNeighborhood.time = t('to_be_confirmed')
    }
    if (neighborhoodAlreadyExists) {
      setShowSpinner(false)
      return handleShowToast({
        type: 'alert',
        title: t('neighborhood_name'),
        content: t('neighborhood_cannot_duplicated'),
      })
    }
    if (city?.city !== '' && newNeighborhood.name !== '' && newNeighborhood.time !== '') {
      try {
        const body = {
          distance: newNeighborhood.name,
          time: newNeighborhood.time,
          value: newNeighborhood.value.toString(),
          city: newTax.city,
        }
        const { data } = await apiRoute('/dashboard/profile/taxDelivery', session, 'POST', body)
        const haveTaxIndex = taxDelivery.findIndex((t) => t.city === data.tax.city)
        if (haveTaxIndex !== -1) {
          taxDelivery[haveTaxIndex].neighborhoods = [...taxDelivery[haveTaxIndex].neighborhoods, ...data.tax.neighborhoods]
          setProfile({ ...profile, taxDelivery })
        } else {
          newTax.neighborhoods = data.tax.neighborhoods
          setNewTax({ ...newTax })
          setProfile({ ...profile, taxDelivery: [...taxDelivery, newTax] })
        }
        handleShowToast({
          type: 'success',
          content: `${city ? t('neighborhood_added') : t('city_and_neighborhood_added')} ${t('successfully')}`,
          title: `${city ? t('neighborhood') : t('city')}`,
        })
        setNewNeighborhood({
          code: hash(),
          name: '',
          time: '',
          value: '',
        })
      } catch (error: any) {
        handleShowToast({
          type: 'erro',
          content: (error && (error as AxiosError))?.response.data.message,
        })
        console.error(error)
      } finally {
        setShowSpinner(false)
      }
    } else {
      setShowSpinner(false)
      handleShowToast({
        type: 'alert',
        content: ``,
        title: ``,
      })
    }
  }

  const handleEditTax = async (tax: ProfileTaxDeliveryNeighborhood, neighborhood: ProfileTaxDeliveryNeighborhoodItem) => {
    setShowSpinner(true)
    const neighborhoodAlreadyExists = tax.neighborhoods.filter((n) => n.code !== neighborhood.code).find((n) => n.name === neighborhood.name)
    newNeighborhood.value = Number(neighborhood.value) < 0 ? '0' : neighborhood.value
    if (!neighborhood.time) {
      neighborhood.time = t('to_be_confirmed')
    }
    if (neighborhoodAlreadyExists) {
      setShowSpinner(false)
      return handleShowToast({
        type: 'alert',
        title: t('neighborhood_name'),
        content: t('neighborhood_cannot_duplicated'),
      })
    }

    const body = { tax: tax.code, neighborhood }
    if (neighborhood.name && neighborhood.time && Number(neighborhood.value) >= 0) {
      neighborhood.value = String(neighborhood.value).replace(',', '.')
      try {
        const { data } = await apiRoute('/dashboard/profile/tax/neighborhood/update', session, 'PUT', body)

        let updatedNeighborhood = tax.neighborhoods.find((n) => n.code === data.code)
        updatedNeighborhood = data
        setProfile({ ...profile, taxDelivery })
        handleShowToast({
          type: 'success',
          content: '',
          title: t('neighborhood'),
        })
      } catch (error) {
        handleShowToast({ type: 'erro' })
        console.error(error)
      }
    } else {
      handleShowToast({ type: 'alert' })
    }
    setShowSpinner(false)
  }

  const handleRemoveTax = async (tax: ProfileTaxDeliveryNeighborhood, neighborhood: ProfileTaxDeliveryNeighborhoodItem) => {
    setNewTax({
      city: tax.city,
      code: hash(),
      neighborhoods: [],
    })
    handleConfirmModal({
      actionConfirm: async () => {
        try {
          setShowSpinner(true)
          await apiRoute(`/dashboard/profile/taxDelivery/${neighborhood.code}/delete`, session, 'DELETE')

          let updatedTax = taxDelivery.find((t) => t.code === tax.code)
          if (updatedTax) {
            updatedTax.neighborhoods = updatedTax.neighborhoods.filter((n) => n.code !== neighborhood.code)
          }

          if (!tax.neighborhoods.length) {
            taxDelivery = taxDelivery.filter((t) => t.code !== tax.code)
          }
          setProfile({ ...profile, taxDelivery })
          handleShowToast({
            type: 'success',
            content: `${tax.neighborhoods.length ? t('neighborhood_deleted') : t('city_deleted')} com sucesso`,
            title: `${tax.neighborhoods.length ? t('neighborhood') : t('city')}`,
          })
          setShowSpinner(false)
        } catch (error) {
          handleShowToast({ type: 'erro' })
          console.error(error)
        }
      },
    })
  }

  return (
    <>
      <OverlaySpinner show={showSpinner} textSpinner={t('please_wait')} />
      <Row className="mb-5">
        <Col md className="mb-2">
          <Form.Label>{t('city')}</Form.Label>
          <Form.Control
            type="text"
            value={newTax.city ?? profile.address.city}
            onChange={(e) => handleCheckCity(e.target.value)}
            placeholder={t('city')}
            id="cityInput"
          />
        </Col>
        <Col md className="mb-2">
          <Form.Label className="text-nowrap">{t('neighborhood_name')}</Form.Label>
          <Form.Control
            type="text"
            value={newNeighborhood.name}
            id="nameInput"
            placeholder={t('neighborhood')}
            onChange={(e) => setNewNeighborhood({ ...newNeighborhood, name: e.target.value })}
          />
        </Col>
        <Col md className="mb-2">
          <Form.Label className="text-nowrap">{t('time_minutes')}</Form.Label>
          <Form.Control
            // type="number"
            // min={0}
            value={newNeighborhood.time}
            id="timeInput"
            onChange={(e) => {
              setNewNeighborhood({ ...newNeighborhood, time: e.target.value })
            }}
            placeholder={t('to_be_confirmed')}
          />
        </Col>
        <Col md className="mb-2">
          <Form.Label>{t('value')}</Form.Label>
          <Form.Control
            // type="number"
            value={newNeighborhood.value}
            id="valueInput"
            min={0}
            onChange={(e) => {
              mask(e, 'currency')
              setNewNeighborhood({
                ...newNeighborhood,
                value: e.target.value,
              })
            }}
            placeholder={t('to_be_confirmed')}
          />
        </Col>
        <Col md="2" className="mb-2 d-flex">
          <Button
            className="mt-auto w-100 flex-grow-1"
            onClick={() => {
              handleAddTax()
            }}
          >
            + {t('add')}
          </Button>
        </Col>
      </Row>

      {taxDelivery.map((tax) => (
        <Row key={tax.code} className="mb-5">
          <Col md>
            <h3>{tax.city}</h3>
            <hr />
            <Table responsive hover>
              <thead>
                <tr>
                  <th>{t('neighborhood')}</th>
                  <th>{t('time_minutes')}</th>
                  <th>{t('value')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tax.neighborhoods.map((neighborhood) => (
                  <tr key={neighborhood.code} className="align-baseline">
                    <td style={{ minWidth: '9rem' }}>
                      <InputGroup>
                        <Form.Control
                          defaultValue={neighborhood.name}
                          onChange={(e) => {
                            neighborhood.name = e.target.value
                          }}
                        />
                      </InputGroup>
                    </td>
                    <td>
                      <InputGroup className="flex-nowrap">
                        <InputGroup.Text>Min. </InputGroup.Text>
                        <Form.Control
                          type="text"
                          defaultValue={neighborhood.time}
                          onChange={(e) => {
                            neighborhood.time = e.target.value
                          }}
                          placeholder={t('to_be_confirmed')}
                          style={{ minWidth: 120 }}
                        />
                      </InputGroup>
                    </td>
                    <td style={{ minWidth: '9rem' }}>
                      <InputGroup>
                        <InputGroup.Text>{currency({ value: 0, symbol: true })}</InputGroup.Text>
                        <Form.Control
                          // type="number"
                          min={0}
                          defaultValue={Number(neighborhood.value ?? undefined) >= 0 ? Number(neighborhood.value ?? undefined).toFixed(2) : undefined}
                          onChange={(e) => {
                            mask(e, 'currency')
                            neighborhood.value = e.target.value
                          }}
                          placeholder={t('to_be_confirmed')}
                        />
                      </InputGroup>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          className="flex-grow-1"
                          onClick={() => {
                            handleEditTax(tax, neighborhood)
                          }}
                        >
                          {t('save')}
                        </Button>
                        <Button
                          variant="danger"
                          className="flex-grow-1"
                          onClick={() => {
                            handleRemoveTax(tax, neighborhood)
                          }}
                        >
                          <span>{t('delete')}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      ))}
    </>
  )
}
