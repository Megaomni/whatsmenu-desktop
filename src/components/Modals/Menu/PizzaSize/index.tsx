import { Dispatch, FormEvent, SetStateAction, useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Container, Figure, Form, Modal, Nav, Row, Tab, Spinner, InputGroup } from 'react-bootstrap'
import { FaSave } from 'react-icons/fa'
import { BsExclamationCircle, BsFillPauseCircleFill, BsFillTrashFill } from 'react-icons/bs'
import { RiImageAddLine } from 'react-icons/ri'
import { ImCancelCircle } from 'react-icons/im'
import { Crop } from 'react-image-crop'
import { CropModal } from '../../CropModal'
import { UseResize } from '../../../../hooks/useResize'
import { ConfirmModal } from '../../Confirm'
import PizzaProduct, { PizzaSizeType } from '../../../../types/pizza-product'
import { apiRoute, hash, normalizeCaracter } from '../../../../utils/wm-functions'
import { AppContext } from '../../../../context/app.ctx'
import Category from '../../../../types/category'
import { useSession } from 'next-auth/react'
import { MenuContext } from '../../../../context/menu.ctx'
import { OverlaySpinner } from '../../../OverlaySpinner'
import { ActionsFooterButton } from '../../ModalFooter/Actions'
import { ArrowModalFooter } from '../../../Generic/ArrowsModalFooter'
import { useTranslation } from 'react-i18next'

interface PizzaSizeProps {
  show: boolean
  handleClose: () => void
  type: 'create' | 'update'
  size: PizzaSizeType
  tab?: 'details' | 'covers'
  category: Category
  setCategory: Dispatch<SetStateAction<Category>>
}

export function PizzaSize(props: PizzaSizeProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()

  const { handleConfirmModal, handleShowToast, modalFooterOpened } = useContext(AppContext)
  const { setSize, categories, setCategories } = useContext(MenuContext)

  const { show, handleClose, type, size, tab, category, setCategory } = props
  const flavors = [`1 ${t('flavor')}`, `2 ${t('flavors')}`, `3 ${t('flavors')}`, `4 ${t('flavors')}`]
  const [sizes, setSizes] = useState<any>({
    1: false,
    2: false,
    3: false,
    4: false,
  })

  const [updateHTML, setUpdateHTML] = useState(0)

  const [showSpinner, setShowSpinner] = useState(false)
  const [showSaveSpinner, setShowSaveSpinner] = useState<boolean>(false)
  const [showPauseSpinner, setShowPauseSpinner] = useState<boolean>(false)

  const [nameInvalid, setNameInvalid] = useState(false)
  const [eventKeyTab, setEventKeysTabs] = useState<'details' | 'covers'>(tab as any)

  const [name, setName] = useState(size?.name || '')
  const [sizeCovers, setSizeCovers] = useState<any>({})
  const [sizeIndex, setSizeIndex] = useState<number>(1)
  const [covers, setCovers] = useState<string[]>(size?.covers || Array(4).fill(''))
  const [inputFileImage, setInputFileImage] = useState<HTMLInputElement>()

  useEffect(() => {
    setName(size?.name || '')
    Object.entries(sizes).forEach((item, index) => {
      sizes[item[0]] = !!size.flavors.find((fl) => fl === Number(item[0]))
    })

    if (size?.covers.length) {
      size.covers.forEach((sizeCover, index) => {
        covers[index] = sizeCover === '' ? `/images/pizzas/${index + 1}.jpg` : sizeCover
      })
    } else {
      const imgs = Array(4)
        .fill('')
        .map((i, index) => (i = `/images/pizzas/${index + 1}.jpg`))
      setCovers(imgs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  const modalCrop = (
    <CropModal
      inputFile={inputFileImage}
      typeCrop="pizzaSizeCover"
      show={!!inputFileImage}
      setImageBlob={(fileBlob, url) => {
        const newCovers = covers
        newCovers[sizeIndex] = url
        setCovers(newCovers)
        setSizeCovers({ ...sizeCovers, [`${sizeIndex + 1}`]: fileBlob })
      }}
      quality={1}
      maxWidth={200}
      maxHeight={150}
      onHide={() => {
        setInputFileImage(undefined)
      }}
    />
  )

  const createOrUpdateSize = async (e: FormEvent) => {
    e.preventDefault()

    try {
      const inputName = document.getElementById('sizeName') as HTMLInputElement
      const form = document.getElementById('form-size') as HTMLFormElement
      const body = new FormData(form)

      if (!name.trim()) {
        setEventKeysTabs('details')
        setTimeout(() => {
          setNameInvalid(true)
          inputName.focus()
        }, 10)
        return
      }

      setShowSaveSpinner(true)

      body.append('1', sizes[1])
      body.append('2', sizes[2])
      body.append('3', sizes[3])
      body.append('4', sizes[4])

      for (const [key, value] of Object.entries(sizeCovers)) {
        body.append(`image${key}`, value as Blob)
      }

      const { product } = category

      if (product) {
        if (type === 'create') {
          const sizeExists = category?.product?.sizes.find((sz) => sz.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase())

          if (sizeExists) {
            handleShowToast({
              show: true,
              type: 'alert',
              title: t('size'),
              content: `${'size_name_already_exists'} ${name}".`,
            })

            inputName.focus()
            setShowSaveSpinner(false)

            return
          }
        }

        await PizzaProduct.API({
          type: type.toUpperCase() as 'CREATE' | 'UPDATE',
          session,
          body,
          product,
          property: 'size',
          itemCode: size.code,
          name,
        })

        setShowSaveSpinner(false)
        setNameInvalid(false), setCategory(category)

        handleShowToast({
          show: true,
          title: t('size'),
          content: `${size.name?.trim() || name}, foi ${type == 'create' ? t('created_o') : t('updated_o')} ${t('sucessfully')}.`,
          type: 'success',
        })
        handleClose()
      }
    } catch (e) {
      console.error(e)
      setShowSaveSpinner(false)
      handleShowToast({
        show: true,
        type: 'erro',
        title: t('size'),
        content: `${t('could_not')} ${type === 'create' ? t('create') : t('update')} ${t('the_size')} ${size.name}.`,
      })
    }
  }

  const deleteSize = async () => {
    const { product } = category
    try {
      if (product) {
        if (product.flavors.length && product.sizes.length === 1) {
          handleShowToast({
            show: true,
            title: t('size'),
            content: `${t('message_delete_remove_another')}.`,
            type: 'alert',
          })

          return
        }

        handleConfirmModal({
          show: true,
          actionConfirm: async () => {
            await PizzaProduct.API({
              type: 'DELETE',
              property: 'size',
              session,
              product,
              categories: categories,
              setCategories: setCategories,
              itemCode: size.code,
            })

            handleShowToast({
              show: true,
              title: t('size'),
              content: `${size.name}, ${t('was_deleted_sucessfully')}.`,
              type: 'success',
            })

            handleClose()
          },
          title: t('size'),
          message: `${t('message_really_delete_size')}, ${size.name}.`,
        })
      }
    } catch (e) {
      console.error(e)
      handleShowToast({
        show: true,
        title: t('size'),
        content: `${t('message_could_not_delete')} ${size.name}.`,
        type: 'erro',
      })
    }
  }

  const pauseSize = async () => {
    const { product } = category
    setShowPauseSpinner(true)
    try {
      if (product) {
        const newSize = await PizzaProduct.API({
          type: 'STATUS',
          property: 'size',
          session,
          product,
          categories,
          setCategories,
          itemCode: size.code,
        })

        if (newSize) {
          setSize(newSize)
        }

        handleShowToast({
          show: true,
          type: 'success',
          title: t('size'),
          content: `${size.name}, foi ${size.status ? t('paused') : t('unpaused')} ${t('sucessfully')}.`,
        })
      }
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        type: 'erro',
        title: t('size'),
        content: `${t('could_not')} ${size.status ? t('pause') : t('unpause')} ${t('the_size')} ${size.name}.`,
      })
    } finally {
      setShowPauseSpinner(false)
    }
  }

  const findSize = (name: string) => {
    return !!category?.product?.sizes?.find((sz) => sz.code !== size.code && normalizeCaracter(sz.name) === normalizeCaracter(name))
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.altKey) {
          if (e.code === 'Enter') {
            createOrUpdateSize(e)
          }
        }
      }}
    >
      {modalCrop}
      <Modal
        show={show}
        keyboard
        onHide={() => handleClose()}
        scrollable
        dialogClassName={`${window.innerWidth > 768 ? 'modal-90' : ''} mx-auto`}
        fullscreen={window.innerWidth < 768 ? true : undefined}
        onEntering={() => tab && setEventKeysTabs(tab)}
        onExited={() => {
          setNameInvalid(false)
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{type === 'create' ? t('add_size') : `${t('edit_size')} (${size.name})`}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="position-relative">
          <form id="form-size" onSubmit={(e) => createOrUpdateSize(e)}>
            {showSpinner && (
              <div
                className="position-absolute top-0 start-0 bottom-0 end-0 d-flex justify-content-center align-items-center"
                style={{ zIndex: 1000, background: 'rgba(255, 255, 255, .5)' }}
              >
                <Spinner animation="border" />
              </div>
            )}
            <Tab.Container id="" activeKey={eventKeyTab}>
              <Row>
                <Col sm={12}>
                  <Nav variant="tabs" className="flex-row">
                    <Nav.Item>
                      <Nav.Link eventKey="details" onClick={(e) => setEventKeysTabs('details')}>
                        {t('details')}
                        {eventKeyTab !== 'details' && nameInvalid && (
                          <span className="ms-2">
                            <BsExclamationCircle className="pulseElement" color="red" size={20} />
                          </span>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                    {Object.values(sizes).some((vs) => vs) && (
                      <Nav.Item>
                        <Nav.Link eventKey="covers" onClick={(e) => setEventKeysTabs('covers')}>
                          {t('cover')}
                        </Nav.Link>
                      </Nav.Item>
                    )}
                  </Nav>
                  <Tab.Content>
                    <Tab.Pane eventKey="details">
                      <Card className="mt-4">
                        <Card.Body>
                          <Container fluid className="px-0 mx-0">
                            <Row className="text-dark">
                              <Col sm className="my-auto">
                                <Row>
                                  <Col sm>
                                    <Form.Label>
                                      <b>{t('name')}</b>
                                    </Form.Label>
                                    <div className="position-relative">
                                      <Form.Control
                                        value={name}
                                        id="sizeName"
                                        name="name"
                                        autoComplete="off"
                                        autoFocus
                                        isInvalid={findSize(name) || nameInvalid}
                                        maxLength={55}
                                        onChange={(e) => {
                                          if (nameInvalid) {
                                            setNameInvalid(false)
                                          }
                                          setName(e.target.value)
                                        }}
                                      />
                                      <Form.Control.Feedback tooltip type="invalid" className="mt-1">
                                        {nameInvalid && !name && `${t('please_valid_name')}!`}
                                        {findSize(name) && `${t('size_name_already_exists')}.`}
                                      </Form.Control.Feedback>
                                    </div>
                                    <div className="d-flex justify-content-end">
                                      <p className={name.length >= 55 ? 'text-red-500' : ''}>
                                        {name.length}/55
                                        {t('characters')}
                                      </p>
                                    </div>
                                  </Col>
                                </Row>
                                <Row>
                                  <Col sm className="d-flex flex-column">
                                    <Form.Label>
                                      <b>{t('this_size_accepts')}</b>
                                    </Form.Label>
                                    <div className="d-flex flex-wrap flex-md-nowrap justify-content-start gap-2">
                                      {flavors.map((flavor, index) => {
                                        return (
                                          <div
                                            key={`${flavor}`}
                                            className="d-flex flex-row-reverse gap-2 justify-content-end "
                                            {...{ style: { flex: window.innerWidth < 768 ? '1 0 25%' : '' } }}
                                          >
                                            <Form.Label htmlFor={`${flavor}`}>
                                              <span className="fs-8 text-nowrap fw-bold">{flavor}</span>
                                            </Form.Label>
                                            <Form.Check
                                              id={`${flavor}`}
                                              defaultChecked={!!sizes[index + 1]}
                                              required={index === 0 && Object.values(sizes).every((vs) => !vs)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  sizes[index + 1] = true
                                                } else {
                                                  sizes[index + 1] = false
                                                }
                                                setUpdateHTML(updateHTML + 1)
                                              }}
                                            />
                                          </div>
                                        )
                                      })}
                                    </div>
                                    <br />
                                    {type !== 'create' && (
                                      <div className="wm-default-border-none text-dark py-5 px-3 position-relative">
                                        <Row className="align-items-center">
                                          <Col sm className="d-flex">
                                            <Button variant="outline-orange" className="flex-grow-1 mb-3" onClick={pauseSize}>
                                              <BsFillPauseCircleFill size={20} />

                                              <span>{!size?.status ? t('resume_sales') : t('pause_sales')}</span>
                                            </Button>
                                          </Col>
                                          <Col sm className="text-600 fs-8 mb-3">
                                            {t('message_pause_sales')}
                                          </Col>
                                        </Row>
                                        <OverlaySpinner show={showPauseSpinner} backgroundColor="transparent" />
                                      </div>
                                    )}
                                  </Col>
                                </Row>
                              </Col>
                            </Row>
                          </Container>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                    <Tab.Pane eventKey="covers">
                      <br />
                      <Card>
                        <Card.Header>
                          <b>{t('add_cover')}</b>
                        </Card.Header>
                        <Card.Body className="d-flex justify-content-center">
                          <Row>
                            {covers.map((cover: string, index) => {
                              if (sizes[index + 1]) {
                                return (
                                  <Col sm key={`${hash()}-${cover}-${index}`} className="flex-grow-1">
                                    <Figure className="w-100 d-flex flex-column">
                                      <Figure.Image
                                        width={200}
                                        height={150}
                                        alt="Imagem do Produto"
                                        src={cover}
                                        id={`sizeImage-${index + 1}`}
                                        style={{
                                          objectFit: 'contain',
                                          maxHeight: '150px',
                                          minHeight: '150px',
                                          margin: 'auto',
                                        }}
                                      />
                                      <Figure.Caption className="text-center">
                                        {index === 0 ? `1 ${t('flavor')}` : `${index + 1} ${t('flavors')}`}
                                      </Figure.Caption>
                                      <Button variant="outline-success mt-4 w-100" style={{ position: 'relative' }}>
                                        <span className="fs-7">{t('add_image')}</span>
                                        <Form.Control
                                          type="file"
                                          onChange={(e) => {
                                            setSizeIndex(index)
                                            setInputFileImage(e.target as HTMLInputElement)
                                          }}
                                          // name={`image${index + 1}`}
                                          style={{
                                            opacity: 0,
                                            position: 'absolute',
                                            top: 0,
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                          }}
                                        />
                                      </Button>
                                    </Figure>
                                  </Col>
                                )
                              }

                              return
                            })}
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </form>
        </Modal.Body>
        <Modal.Footer
          className={`${type === 'update' ? 'justify-content-between' : undefined} position-relative ${
            modalFooterOpened ? 'show' : 'hidden'
          }-buttons-modal-footer`}
        >
          <ArrowModalFooter />
          <ActionsFooterButton
            type={type}
            disabledButtonSave={nameInvalid}
            createOrUpdate={createOrUpdateSize}
            deleteFunction={deleteSize}
            handleClose={handleClose}
          />
        </Modal.Footer>
        <OverlaySpinner show={showSaveSpinner} />
      </Modal>
    </div>
  )
}
