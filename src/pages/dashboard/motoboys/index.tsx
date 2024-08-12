import { useState, useContext } from 'react'
import { Card, Form, Button, ListGroup, FormLabel, Table, ButtonGroup, Row, Col } from 'react-bootstrap'
import { CartsContext } from '@context/cart.ctx'
import { Title } from '@components/Partials/title'
import { apiRoute, maskedPhone } from '@utils/wm-functions'
import { useSession } from 'next-auth/react'
import { AppContext } from '@context/app.ctx'
import { HelpVideos } from '@components/Modals/HelpVideos'
import { useTranslation } from 'react-i18next'

interface MotoboysProps {}

export default function Motoboys({}: MotoboysProps) {
  const { t } = useTranslation()
  const { motoboys, setMotoboys } = useContext(CartsContext)
  const { profile } = useContext(AppContext)
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [editing, setEditing] = useState(false)
  const [editMode, setEditMode] = useState({ id: null, name: false, whatsapp: false })
  const [editName, setEditName] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!name || !whatsapp) {
      alert(t('fill_all_fields'))
    }
    try {
      const response = await apiRoute('/dashboard/motoboys', session, 'POST', {
        name,
        whatsapp,
        profileId: profile.id,
        status: true,
      })
      setMotoboys((prevMotoboys: any) => [...prevMotoboys, response.data])
      setName('')
      setWhatsapp('')
    } catch (error) {
      console.error(t('error_deleting_delivery_person'), error)
      throw error
    }
  }

  const handlePause = async (motoboy: any) => {
    try {
      const newStatus = !motoboy.status
      await apiRoute(`/dashboard/motoboys/${motoboy.id}`, session, 'PATCH', {
        status: newStatus,
      })
      setMotoboys((prevMotoboys) =>
        prevMotoboys.map((prevMotoboy) => (prevMotoboy.id === motoboy.id ? { ...prevMotoboy, status: newStatus } : prevMotoboy))
      )
    } catch (error) {
      console.error(t('error_pausing_activating'), error)
    }
  }

  const handleStartEdit = async (motoboy: any) => {
    setEditing(true)
    setEditMode({ id: motoboy.id, name: true, whatsapp: true })
    setEditName(motoboy.name)
    setEditWhatsapp(motoboy.whatsapp)
  }

  const handleCancelEdit = async (motoboy: any) => {
    setEditing(false)
    setEditMode({ id: null, name: false, whatsapp: false })
    setEditName('')
    setEditWhatsapp('')
  }

  const saveEdit = async (motoboy: any) => {
    try {
      const { data } = await apiRoute(`/dashboard/motoboys/${motoboy.id}`, session, 'PATCH', {
        name: editName,
        whatsapp: maskedPhone(editWhatsapp),
      })
      setMotoboys((prevMotoboys) => prevMotoboys.map((prevMotoboy) => (prevMotoboy.id === motoboy.id ? data : prevMotoboy)))
      setEditMode({ id: null, name: false, whatsapp: false })
      setEditName('')
      setEditWhatsapp('')
    } catch (error) {
      console.error(t('error_editing_delivery_person'), error)
    }
  }

  const handleDelete = async (motoboyId: any) => {
    try {
      await apiRoute(`/dashboard/motoboys/${motoboyId}`, session, 'DELETE')
      setMotoboys((prevMotoboys: any) => prevMotoboys.filter((motoboy: any) => motoboy.id !== motoboyId))
    } catch (error) {
      console.error(t('error_deleting_delivery_person'), error)
    }
  }

  return (
    <>
      <Title title={t('delivery_drivers')} componentTitle={t('delivery_drivers')} className="mb-4 fw-600" />
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4 className="">{t('delivery_registration')}</h4>
          <div className="vr"></div>
          <HelpVideos.Trigger urls={[{ src: 'https://www.youtube.com/embed/nofncdMpVM4', title: t('delivery_drivers') }]} />
        </Card.Header>
        <Card.Body className="d-flex flex-column align-items-start">
          <Form onSubmit={handleSubmit} className="w-100">
            <Row className="d-flex mb-2 gap-1">
              <Col sm={12} lg={4} className="p-0 m-0">
                <Form.Group className="mb-1 mb-sm-0 p-1" style={{ width: '100%' }}>
                  <FormLabel className="fw-600 fs-7">{t('delivery_person_name')}:</FormLabel>
                  <Form.Control
                    type="text"
                    placeholder={t('enter_delivery_person')}
                    className="fw-600 fs-7 form-control-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col sm={12} lg={4} className="p-0 m-0 ">
                <Form.Group className="mb-1 mb-sm-0 p-1" style={{ width: '100%' }}>
                  <FormLabel className="fw-600 fs-7">WhatsApp:</FormLabel>
                  <Form.Control
                    type="text"
                    maxLength={15}
                    className="fw-600 fs-7 form-control-sm"
                    placeholder={t('enter_whatsapp_number')}
                    value={maskedPhone(whatsapp)}
                    onChange={(e) => setWhatsapp(maskedPhone(e.target.value))}
                  />
                </Form.Group>
              </Col>
              <Col className="d-grid col-lg-1 col-12 mt-auto p-0 m-0">
                <Button variant="primary" className="m-1" size="sm" type="submit" onClick={handleSubmit}>
                  {t('add')}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      <>
        <div>
          <h1 className="fs-3 align-middle text-uppercase mb-3">{t('registered_delivery')} </h1>
          <Card>
            <div className="table-border p-3">
              <Row xs={12} className="">
                <Table
                  striped
                  // window.innerWidth <= 768 ? 'col-sm-12 table-striped table-condensed cf' : 'table responsive'
                  className="col-sm-12 table table-striped table-condensed cf no-more-tables"
                >
                  <thead className="justify-content-center ">
                    <tr>
                      <th className="fs-7 fw-600">
                        <span> {t('delivery_drivers')}: </span>
                      </th>
                      <th className="fs-7 fw-600">
                        <span> WhatsApp: </span>
                      </th>
                      <th className="fs-7 fw-600 justify-content-center d-flex">
                        <span> {t('actions')}: </span>
                      </th>
                    </tr>
                  </thead>
                  {
                    <tbody>
                      {motoboys?.map((motoboy) => (
                        <tr key={motoboy.id} className={`${motoboy.status ? '' : 'table-danger border-danger '} fs-7`}>
                          <td className={`${motoboy.status ? '' : 'text-danger'} fs-7 pt-2`}>
                            {editMode.id === motoboy.id && editMode.name ? (
                              <Form.Control
                                className="form-control-sm"
                                style={{ width: '19rem' }}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            ) : (
                              motoboy.name
                            )}
                          </td>
                          <td className={`${motoboy.status ? '' : 'text-danger'} fs-7`}>
                            {editMode.id === motoboy.id && editMode.whatsapp ? (
                              <Form.Control
                                className="form-control-sm"
                                style={{ width: '19rem' }}
                                type="text"
                                value={maskedPhone(editWhatsapp)}
                                maxLength={15}
                                onChange={(e) => setEditWhatsapp(e.target.value)}
                              />
                            ) : (
                              motoboy.whatsapp
                            )}
                          </td>
                          <td className="col-12 col-lg-3 fs-7 pb-2">
                            <ButtonGroup className="d-flex justify-content-end mt-auto ms-auto gap-2 ">
                              {editMode.id === motoboy.id ? (
                                <Button
                                  variant="link text-decoration-none"
                                  className={`fs-7 ${motoboy.status ? '' : 'link-danger'}`}
                                  onClick={() => saveEdit(motoboy)}
                                >
                                  Salvar
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="link text-decoration-none"
                                    className={`fs-7 ${motoboy.status ? '' : 'link-danger'}`}
                                    onClick={() => handleStartEdit(motoboy)}
                                  >
                                    {t('edit')}
                                  </Button>
                                  <Button
                                    variant="link text-decoration-none"
                                    className={`fs-7 ${motoboy.status ? '' : 'link-danger'}`}
                                    onClick={() => handlePause(motoboy)}
                                  >
                                    {motoboy.status ? t('pause') : t('activate')}
                                  </Button>
                                </>
                              )}
                              {editMode.id === motoboy.id ? (
                                <Button
                                  variant="link text-decoration-none"
                                  className={`fs-7 ${motoboy.status ? '' : 'link-danger'}`}
                                  onClick={() => handleCancelEdit(motoboy.id)}
                                >
                                  Cancelar
                                </Button>
                              ) : null}
                              {editMode.id !== motoboy.id ? (
                                <Button
                                  variant="link text-decoration-none"
                                  className={`fs-7 ${motoboy.status ? '' : 'link-danger'}`}
                                  color=""
                                  onClick={() => handleDelete(motoboy.id)}
                                >
                                  {t('delete')}
                                </Button>
                              ) : null}
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  }
                </Table>
              </Row>
            </div>
          </Card>
        </div>
      </>
    </>
  )
}
