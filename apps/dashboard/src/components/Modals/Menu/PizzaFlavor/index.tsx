import { FormEvent, useContext, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Container,
  Figure,
  Form,
  Modal,
  Nav,
  Row,
  Tab,
  InputGroup,
  Spinner,
  FormGroup,
} from 'react-bootstrap'
import { BsFillPauseCircleFill } from 'react-icons/bs'
import { CropModal } from '../../CropModal'
import PizzaProduct, {
  PizzaFlavorType,
  PizzaSizeType,
} from '../../../../types/pizza-product'
import Category from '../../../../types/category'
import {
  copy,
  encryptEmoji,
  mask,
  modifyFontValues,
} from '../../../../utils/wm-functions'
import { AppContext } from '../../../../context/app.ctx'
import { useSession } from 'next-auth/react'
import { OverlaySpinner } from '../../../OverlaySpinner'
import { MenuContext } from '../../../../context/menu.ctx'
import { ActionsFooterButton } from '../../ModalFooter/Actions'
import { ArrowModalFooter } from '../../../Generic/ArrowsModalFooter'
import { useTranslation } from 'react-i18next'

interface PizzaFlavorProps {
  show: boolean
  handleClose: () => void
  type: 'create' | 'update'
  flavor: PizzaFlavorType
  sizes: PizzaSizeType[]
  categories: Category[]
  category: Category
}

export function PizzaFlavorModal(props: PizzaFlavorProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const {
    profile,
    handleConfirmModal,
    handleShowToast,
    plansCategory,
    modalFooterOpened,
    user,
    currency,
  } = useContext(AppContext)
  const {
    show,
    handleClose,
    type,
    flavor: propsFlavor,
    sizes,
    category,
  } = props

  const { categories, setCategories } = useContext(MenuContext)

  const [flavor, setFlavor] = useState(propsFlavor)

  const [nameInvalid, setNameInvalid] = useState(false)
  const [showSpinner, setShowSpinner] = useState(false)
  const [overlayPause, setOverlayPause] = useState(false)

  const [inputFileImage, setInputFileImage] = useState<HTMLInputElement>()
  const [imageCropped, setImageCropped] = useState<File>()

  // LABELS

  const labels = {
    basic:
      plansCategory.includes('basic') &&
      plansCategory.some((plan) => plan !== 'basic')
        ? 'Delivery'
        : '',
    table:
      plansCategory.includes('table') &&
      plansCategory.some((plan) => plan !== 'table')
        ? t('table')
        : '',
    package:
      plansCategory.includes('package') &&
      plansCategory.some((plan) => plan !== 'package')
        ? profile.options.package.label2
          ? t('appointment')
          : t('package')
        : '',
  }

  useEffect(() => {
    sizes.forEach((size) => {
      if (!propsFlavor.values[size.name]) {
        propsFlavor.values[size.name] = 0
      }

      if (!propsFlavor.valuesTable[size.name]) {
        propsFlavor.valuesTable[size.name] = 0
      }

      setFlavor(copy(propsFlavor))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsFlavor])

  const createOrUpdateFlavor = async (e: FormEvent) => {
    e.preventDefault()
    if (!flavor?.name?.length) {
      setNameInvalid(true)
      return
    }

    try {
      const form = document.getElementById('form-flavors') as HTMLFormElement
      const dataFlavor = new FormData(form)

      setShowSpinner(true)

      if (imageCropped) {
        dataFlavor.append('image', imageCropped)
      }
      dataFlavor.append('values', copy(flavor.values, 'json'))
      dataFlavor.append('valuesTable', copy(flavor.valuesTable, 'json'))

      dataFlavor.set('name', encryptEmoji(flavor.name))
      dataFlavor.set('description', encryptEmoji(flavor.description))

      const { product } = category

      if (product) {
        await PizzaProduct.API({
          type: type.toUpperCase() as 'CREATE' | 'UPDATE',
          property: 'flavor',
          session,
          product,
          body: dataFlavor,
          categories,
          setCategories,
          itemCode: flavor.code,
        })

        setImageCropped(undefined)

        handleShowToast({
          show: true,
          type: 'success',
          title: t('flavors'),
          content: `${flavor.name}, foi ${type === 'create' ? t('created_o') : t('updated')} ${t('sucessfully')}.`,
        })
        handleClose()
      }
    } catch (e) {
      console.error(e)
      handleShowToast({
        show: true,
        type: 'erro',
        title: t('flavors'),
        content: `${t('could_not')} ${type === 'create' ? t('create') : t('updated')}}, ${flavor.name}.`,
      })
    } finally {
      setShowSpinner(false)
    }
  }

  const deleteFlavor = async () => {
    const { product } = category
    handleConfirmModal({
      show: true,
      actionConfirm: async () => {
        try {
          if (product) {
            await PizzaProduct.API({
              type: 'DELETE',
              property: 'flavor',
              session,
              product,
              categories,
              setCategories,
              itemCode: flavor.code,
            })

            handleShowToast({
              show: true,
              type: 'success',
              title: t('flavors'),
              content: `${flavor.name}, ${t('was_deleted_sucessfully')}.`,
            })
            handleClose()
          }
        } catch (e) {
          console.error(e)
          handleShowToast({
            show: true,
            type: 'erro',
            title: t('flavors'),
            content: `${t('could_not_delete_flavor')} ${flavor.name}.`,
          })
        }
      },
      title: t('flavors'),
      message: `${t('you_really_want_delete')}, ${flavor.name} ?`,
      confirmButton: t('yes'),
      cancelButton: t('no'),
    })
  }

  const flavorPause = async () => {
    setOverlayPause(true)
    const { product } = category
    try {
      if (product) {
        const newFlavor = await PizzaProduct.API({
          type: 'STATUS',
          session,
          property: 'flavor',
          product,
          categories,
          setCategories,
          itemCode: flavor.code,
        })

        if (newFlavor) {
          setFlavor(newFlavor)
        }

        handleShowToast({
          show: true,
          type: 'success',
          title: t('flavors'),
          content: `${flavor.name}, foi ${flavor.status ? t('paused') : t('unpaused')} ${t('sucessfully')}.`,
        })
      }
    } catch (e) {
      console.error(e)
      handleShowToast({
        show: true,
        type: 'erro',
        title: t('flavors'),
        content: `${t('could_not')} ${flavor.status ? t('pause') : t('unpause')} ${t('the_flavor')} ${flavor.name}.`,
      })
    }
    setOverlayPause(false)
  }

  const modalCrop = (
    <CropModal
      typeCrop={'pizzaFlavorImage'}
      show={!!inputFileImage}
      inputFile={inputFileImage}
      quality={1}
      maxWidth={600}
      maxHeight={450}
      setImageBlob={(blob: any, url: string) => {
        const imageFlavor = document.getElementById(
          'flavorImage'
        ) as HTMLImageElement
        imageFlavor.src = url
        setImageCropped(blob)
      }}
      onHide={() => {
        setInputFileImage(undefined)
      }}
    />
  )

  return (
    <div
      onKeyDown={(e) => {
        if (e.altKey) {
          if (e.code === 'Enter') {
            createOrUpdateFlavor(e)
          }
        }
      }}
    >
      {modalCrop}
      <Modal
        show={show}
        onHide={handleClose}
        keyboard
        scrollable
        dialogClassName={`${window.innerWidth > 768 ? 'modal-90' : ''} mx-auto`}
        fullscreen={window.innerWidth < 768 ? true : undefined}
        onExited={() => {
          setNameInvalid(false)
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {type === 'create' ? t('add') : t('edit')} {t('flavor')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="position-relative">
          <form id="form-flavors" onSubmit={(e) => createOrUpdateFlavor(e)}>
            <Tab.Container id="" defaultActiveKey="details">
              <Row>
                <Col sm={12}>
                  <Nav variant="tabs" className="flex-row">
                    <Nav.Item>
                      <Nav.Link eventKey="details">{t('details')}</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    <Tab.Pane eventKey="details">
                      <Card className="mt-4">
                        <Card.Body>
                          <Container fluid className="mx-0 px-0">
                            <Row className="text-dark">
                              <Col
                                sm="4"
                                className="d-flex flex-column justify-content-start"
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  maxWidth:
                                    window.innerWidth < 768 ? 'unset' : '250px',
                                }}
                              >
                                <Figure>
                                  <Figure.Image
                                    width={600}
                                    height={450}
                                    alt="Imagem do Produto"
                                    src={flavor.image || '/images/no-img.jpeg'}
                                    id="flavorImage"
                                    style={{ objectFit: 'cover' }}
                                  />
                                  <Figure.Caption className="text-center">
                                    {t('image_up_8')} (
                                    {t('recomended_resolution_600')})
                                  </Figure.Caption>
                                </Figure>
                                <Button
                                  variant="outline-success w-100"
                                  style={{ position: 'relative' }}
                                >
                                  {t('add_image')}
                                  <Form.Control
                                    type="file"
                                    onChange={(e) => {
                                      setInputFileImage(
                                        e.target as HTMLInputElement
                                      )
                                    }}
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
                              </Col>
                              <Col sm className="mt-auto">
                                <Row>
                                  <Col sm className="mt-md-0 mt-3">
                                    <Form.Label>
                                      <b>{t('name')}</b>
                                    </Form.Label>
                                    <div className="position-relative">
                                      <Form.Control
                                        value={flavor.name}
                                        required={nameInvalid}
                                        autoFocus
                                        autoComplete="off"
                                        isInvalid={nameInvalid}
                                        maxLength={55}
                                        onChange={(e) => {
                                          if (nameInvalid) {
                                            setNameInvalid(false)
                                          }
                                          setFlavor({
                                            ...flavor,
                                            name: e.target.value,
                                          })
                                        }}
                                        onKeyDown={(e) =>
                                          modifyFontValues(e, {
                                            prop: flavor.name,
                                          })
                                        }
                                      />
                                      <Form.Control.Feedback
                                        tooltip
                                        type="invalid"
                                      >
                                        {t('please_valid_name')}!
                                      </Form.Control.Feedback>
                                    </div>
                                    <div className="d-flex justify-content-end">
                                      <p
                                        className={
                                          (flavor.name?.length || 0) >= 55
                                            ? 'text-red-500'
                                            : ''
                                        }
                                      >
                                        {flavor.name?.length || 0}/55{' '}
                                        {t('characters')}
                                      </p>
                                    </div>
                                  </Col>
                                  {/* <Col sm>
                                    <Form.Label>
                                      <b>Categoria</b>
                                    </Form.Label>
                                    <Form.Select
                                      defaultValue={category?.id}
                                      name="categoryId"
                                      onChange={(e) => { }}
                                    >
                                      {categories
                                        .filter((c) => c.type === "pizza")
                                        .map((category) => (
                                          <option
                                            key={category.id}
                                            value={category.id}
                                          >
                                            {category.name}
                                          </option>
                                        ))}
                                    </Form.Select>
                                  </Col> */}
                                </Row>
                                <Row>
                                  <Col
                                    sm
                                    className="d-flex flex-column mt-md-0 mt-2"
                                  >
                                    <Form.Label>
                                      <b>{t('description')}</b>
                                    </Form.Label>
                                    <Form.Control
                                      as="textarea"
                                      value={flavor.description || ''}
                                      rows={3}
                                      maxLength={300}
                                      onChange={(e) => {
                                        setFlavor({
                                          ...flavor,
                                          description: e.target.value,
                                        })
                                      }}
                                      onKeyDown={(e) =>
                                        modifyFontValues(e, {
                                          prop: flavor.description,
                                        })
                                      }
                                    />
                                    <div className="d-flex justify-content-end">
                                      <p
                                        className={
                                          flavor.description?.length >= 300
                                            ? 'text-red-500'
                                            : ''
                                        }
                                      >
                                        {flavor.description?.length || 0}/300{' '}
                                        {t('characters')}
                                      </p>
                                    </div>
                                  </Col>
                                </Row>
                                {profile.options.inventoryControl ? (
                                  <Row>
                                    <Col sm="4" className="my-2">
                                      <Form.Label>
                                        <b className="text-nowrap">
                                          {t('stock')}
                                        </b>
                                      </Form.Label>
                                      <InputGroup className="position-relative">
                                        <Button
                                          variant="secondary"
                                          disabled={flavor.bypass_amount}
                                          onClick={() => {
                                            if (
                                              typeof flavor.amount !== 'number'
                                            )
                                              return
                                            setFlavor({
                                              ...flavor,
                                              amount:
                                                flavor.amount === 0
                                                  ? 0
                                                  : flavor.amount - 1,
                                            })
                                          }}
                                        >
                                          -
                                        </Button>
                                        <Form.Control
                                          value={flavor.amount || 0}
                                          disabled={flavor.bypass_amount}
                                          name="amount"
                                          onChange={(e) => {
                                            setFlavor({
                                              ...flavor,
                                              amount: Number(e.target.value),
                                            })
                                          }}
                                        />
                                        <Button
                                          variant="secondary"
                                          disabled={flavor.bypass_amount}
                                          className="rounded-end"
                                          style={{ minWidth: '34.75px' }}
                                          onClick={() => {
                                            setFlavor({
                                              ...flavor,
                                              amount: !flavor.amount
                                                ? 1
                                                : flavor.amount + 1,
                                            })
                                          }}
                                        >
                                          +
                                        </Button>
                                        <Form.Control.Feedback
                                          tooltip
                                          type="invalid"
                                        >
                                          {t('enter_valid_value')}
                                        </Form.Control.Feedback>
                                      </InputGroup>
                                    </Col>
                                    <Col sm="4" className="my-2">
                                      <Form.Label>
                                        <b className="text-nowrap">
                                          {t('minimum_stock')}
                                        </b>
                                      </Form.Label>
                                      <InputGroup className="position-relative">
                                        <Button
                                          disabled={flavor.bypass_amount}
                                          variant="secondary"
                                          onClick={() => {
                                            if (
                                              typeof flavor.amount_alert !==
                                              'number'
                                            )
                                              return
                                            setFlavor({
                                              ...flavor,
                                              amount_alert:
                                                flavor.amount_alert === 0
                                                  ? 0
                                                  : flavor.amount_alert - 1,
                                            })
                                          }}
                                        >
                                          -
                                        </Button>
                                        <Form.Control
                                          disabled={flavor.bypass_amount}
                                          value={flavor.amount_alert || 0}
                                          name="amount_alert"
                                          onChange={(e) => {
                                            setFlavor({
                                              ...flavor,
                                              amount_alert: Number(
                                                e.target.value
                                              ),
                                            })
                                          }}
                                        />
                                        <Button
                                          variant="secondary"
                                          disabled={flavor.bypass_amount}
                                          className="rounded-end"
                                          style={{ minWidth: '34.75px' }}
                                          onClick={() => {
                                            setFlavor({
                                              ...flavor,
                                              amount_alert: !flavor.amount_alert
                                                ? 1
                                                : flavor.amount_alert + 1,
                                            })
                                          }}
                                        >
                                          +
                                        </Button>
                                        <Form.Control.Feedback
                                          tooltip
                                          type="invalid"
                                        >
                                          {t('enter_valid_value')}
                                        </Form.Control.Feedback>
                                      </InputGroup>
                                    </Col>
                                    <Col
                                      sm="4"
                                      className="d-flex align-items-end my-2"
                                    >
                                      <FormGroup>
                                        <Form.Check
                                          type="switch"
                                          id="bypass_amount"
                                          name="bypass_amount"
                                          label={t('always_available')}
                                          className="fs-6 text-nowrap"
                                          defaultChecked={
                                            !!flavor.bypass_amount
                                          }
                                          onClick={(e: any) => {
                                            setFlavor({
                                              ...flavor,
                                              bypass_amount: e.target?.checked,
                                            })
                                          }}
                                        />
                                      </FormGroup>
                                    </Col>
                                  </Row>
                                ) : null}
                              </Col>
                            </Row>
                            <Row className="mt-4">
                              {(plansCategory.includes('basic') ||
                                plansCategory.includes('package')) && (
                                <Col
                                  sm="12"
                                  md={
                                    plansCategory.length > 1 &&
                                    plansCategory.includes('table')
                                      ? '6'
                                      : '12'
                                  }
                                  className={`${plansCategory.includes('table') ? 'border-end' : ''}`}
                                >
                                  <>
                                    <h5>
                                      <b>
                                        {plansCategory.includes('basic') &&
                                        plansCategory.includes('package')
                                          ? `${labels.basic}/${labels.package}`
                                          : plansCategory.includes('basic')
                                            ? labels.basic
                                            : labels.package}
                                      </b>
                                    </h5>

                                    <Row className="">
                                      {sizes.map((size, index) => (
                                        <Col
                                          sm="12"
                                          md="4"
                                          key={size.code}
                                          className={`d-flex flex-column justify-content-between mt-md-0 mt-3 ${index > 2 ? 'mt-md-2' : ''}`}
                                        >
                                          <Form.Label>{size.name}</Form.Label>
                                          <InputGroup className="flex-nowrap">
                                            <InputGroup.Text>
                                              {currency({
                                                value: 0,
                                                symbol: true,
                                              })}
                                            </InputGroup.Text>
                                            <Form.Control
                                              required
                                              value={flavor.values[size.name]}
                                              onChange={(e) => {
                                                mask(e, 'currency')
                                                setFlavor({
                                                  ...flavor,
                                                  values: {
                                                    ...flavor.values,
                                                    [size.name]: e.target.value,
                                                  },
                                                })
                                              }}
                                            />
                                          </InputGroup>
                                        </Col>
                                      ))}
                                    </Row>
                                  </>
                                </Col>
                              )}
                              {plansCategory.includes('table') && (
                                <Col>
                                  <Row className="mt-md-0 mt-4">
                                    <h5>
                                      <b>{labels.table}</b>
                                    </h5>
                                    {sizes.map((size, index) => (
                                      <Col
                                        sm="12"
                                        md={
                                          plansCategory.length > 1 ? '4' : '12'
                                        }
                                        key={size.code}
                                        className={`mt-md-0 mt-3 ${index > 2 ? 'mt-md-2' : ''}`}
                                      >
                                        <Form.Label>{size.name}</Form.Label>
                                        <InputGroup className="flex-nowrap ">
                                          <InputGroup.Text>
                                            {currency({
                                              value: 0,
                                              symbol: true,
                                            })}
                                          </InputGroup.Text>
                                          <Form.Control
                                            required
                                            value={
                                              flavor.valuesTable[size.name]
                                            }
                                            onChange={(e) => {
                                              mask(e, 'currency')
                                              setFlavor({
                                                ...flavor,
                                                valuesTable: {
                                                  ...flavor.valuesTable,
                                                  [size.name]: e.target.value,
                                                },
                                              })
                                            }}
                                          />
                                        </InputGroup>
                                      </Col>
                                    ))}
                                  </Row>
                                </Col>
                              )}
                            </Row>
                            {/* {(plansCategory.includes("basic") ||
                              plansCategory.includes("package")) && (
                                <Row className="mt-4">
                                  <h5>
                                    <b>
                                      {plansCategory.includes("basic") &&
                                        plansCategory.includes("package")
                                        ? `${labels.basic}/${labels.package}`
                                        : plansCategory.includes("basic")
                                          ? labels.basic
                                          : labels.package}
                                    </b>
                                  </h5>

                                  {sizes.map((size) => (
                                    <Col sm="12" md="3" lg="2" key={size.code} className="mt-3 mt-md-0">
                                      <Form.Label>{size.name}</Form.Label>
                                      <InputGroup className="flex-nowrap">
                                        <InputGroup.Text>
                                          {currency(0, true)}
                                        </InputGroup.Text>
                                        <Form.Control
                                          required
                                          value={flavor.values[size.name]}
                                          onChange={(e) => {
                                            mask(e, "currency")
                                            setFlavor({
                                              ...flavor,
                                              values: {
                                                ...flavor.values,
                                                [size.name]: e.target.value,
                                              },
                                            });
                                          }}
                                        />
                                      </InputGroup>
                                    </Col>
                                  ))}
                                </Row>
                              )} */}
                            {/* {plansCategory.includes("table") && (
                              <Row className="mt-4">
                                <h5>
                                  <b>{labels.table}</b>
                                </h5>
                                {sizes.map((size) => (
                                  <Col sm="12" md="3" lg="2" key={size.code} className="mt-3 mt-md-0">
                                    <Form.Label>{size.name}</Form.Label>
                                    <InputGroup className="flex-nowrap mt-2">
                                      <InputGroup.Text>
                                        {currency(0, true)}
                                      </InputGroup.Text>
                                      <Form.Control
                                        required
                                        value={flavor.valuesTable[size.name]}
                                        onChange={(e) => {
                                          mask(e, "currency")
                                          setFlavor({
                                            ...flavor,
                                            valuesTable: {
                                              ...flavor.valuesTable,
                                              [size.name]: e.target.value,
                                            },
                                          });
                                        }}
                                      />
                                    </InputGroup>
                                  </Col>
                                ))}
                              </Row>
                            )} */}
                            {type !== 'create' && (
                              <Row className="mt-4">
                                <Col sm>
                                  <div className="wm-default-border-none text-dark position-relative px-3 py-5">
                                    <Row className="align-items-center">
                                      <Col sm className="d-flex">
                                        <Button
                                          variant="outline-orange"
                                          className="flex-grow-1 mb-3"
                                          onClick={flavorPause}
                                        >
                                          <BsFillPauseCircleFill size={20} />
                                          <span>
                                            {flavor.status
                                              ? t('pause_sales')
                                              : t('resume_sales')}
                                          </span>
                                        </Button>
                                      </Col>
                                      <Col sm className="text-600 fs-8 mb-3">
                                        {t('message_pause_sales')}
                                      </Col>
                                    </Row>
                                    <OverlaySpinner show={overlayPause} />
                                  </div>
                                </Col>
                              </Row>
                            )}
                          </Container>
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
            createOrUpdate={createOrUpdateFlavor}
            deleteFunction={deleteFlavor}
            handleClose={handleClose}
          />
        </Modal.Footer>
        <OverlaySpinner show={showSpinner} position="fixed" />
      </Modal>
    </div>
  )
}
