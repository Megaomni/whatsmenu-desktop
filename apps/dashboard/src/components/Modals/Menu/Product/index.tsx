import { HelpVideos } from '@components/Modals/HelpVideos'
import { useSession } from 'next-auth/react'
import { FormEvent, useContext, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Container,
  Figure,
  Form,
  FormGroup,
  InputGroup,
  Modal,
  Nav,
  Row,
  Spinner,
  Tab,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import {
  BsExclamationCircle
} from 'react-icons/bs'
import { AppContext } from '../../../../context/app.ctx'
import { MenuContext } from '../../../../context/menu.ctx'
import Week from '../../../../types/dates'
import Product, { ProductType } from '../../../../types/product'
import {
  copy,
  encryptEmoji,
  hash,
  mask,
  modifyFontValues,
  verifyEmptyNameLength
} from '../../../../utils/wm-functions'
import { Dates } from '../../../Dates'
import { ArrowModalFooter } from '../../../Generic/ArrowsModalFooter'
import { OverlaySpinner } from '../../../OverlaySpinner'
import { CropModal } from '../../CropModal'
import { ActionsFooterButton } from '../../ModalFooter/Actions'
import { ComplementFormSchema, ComponentComplement } from '../Complements'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from 'src/lib/axios'
import Complement from '../../../../types/complements'

const ProductFormSchema = z.object({
  // id: z.string().optional(),
  categoryId: z.string().transform((value) => parseInt(value)),
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(50, 'O nome deve ter no maúximo 50 caracteres'),
  description: z
    .string()
    .min(3, 'A descrição deve ter pelo menos 3 caracteres')
    .max(100, 'A descrição deve ter no maúximo 100 caracteres')
    .nullable(),
  value: z.string().transform((value) => parseFloat(Number(value).toFixed(2))),
  promoteValue: z.string().transform((value) => parseFloat(Number(value).toFixed(2))),
  valueTable: z.string().transform((value) => parseFloat(Number(value).toFixed(2))),
  promoteValueTable: z.string().transform((value) => parseFloat(Number(value).toFixed(2))),
  promoteStatus: z.boolean().default(false),
  promoteStatusTable: z.boolean().default(false),
  // order: z.number(),
  image: z.string().transform((value) => value.split(',')[1]).optional(),
  bypass_amount: z.boolean().default(true),
  amount: z.string().transform((value) => parseInt(value)),
  amount_alert: z.string().transform((value) => parseInt(value)),
  ncm_code: z.string().optional(),
  disponibility: z.object({ week: z.object<any>({}) }),
  complements: ComplementFormSchema.array()
})

type ProductFormData = z.infer<typeof ProductFormSchema>

interface ProductProps {
  show: boolean
  handleClose: () => void
  type: 'create' | 'update'
}

export function ProductModal({ show, handleClose }: ProductProps) {
  const { t } = useTranslation()
  const {
    profile,
    handleShowToast,
    handleConfirmModal,
    plansCategory,
    modalFooterOpened,
    setLowInventoryItems,
    currency,
  } = useContext(AppContext)
  const {
    product: productMenu,
    setProduct: setProductMenu,
    category,
    categories,
    setCategories,
    typeModal: type,
  } = useContext(MenuContext)


  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      amount: 0,
      amount_alert: 0,
      description: null,
      disponibility: {
        week: new Week(),
      },
      complements: [],
    }
  })

  const { register, handleSubmit, watch, setValue, reset, formState } = form

  const [recicledComplements, setRecicledComplements] = useState<
    { id: number; link: boolean }[]
  >([])
  const [removeComplements, setRemoveComplements] = useState<number[]>([])

  //PROPRIEDADES DO PRODUTO
  const [product, setProduct] = useState<Product | ProductType>(productMenu)
  const [showSaveSpinner, setShowSaveSpinner] = useState<boolean>(false)
  const [invalidComplementName, setInvalidComplementName] =
    useState<boolean>(false)
  const [invalidWeek, setInvalidWeek] = useState<boolean>(false)
  const [nameInvalid, setNameInvalid] = useState<boolean>(false)
  const [valueInvalid, setValueInvalid] = useState<boolean>(false)
  const [valueTableInvalid, setValueTableInvalid] = useState<boolean>(false)
  const [showSpinner, setShowSpinner] = useState<boolean>(false)
  const [showActionsButton, setShowActionsButton] = useState<boolean>(true)

  const [eventKeyTab, setEventKeyTab] = useState<
    'details' | 'complements' | 'promotion' | 'disponibility'
  >('details')
  const [week, setWeek] = useState<Week>(
    new Week(productMenu.disponibility.week)
  )
  const [imageCropped, setImageCroped] = useState<Blob>()

  /** Input tipo file, se input crop modal aparece */
  const [inputFileImage, setInputFileImage] = useState<HTMLInputElement>()

  const { data: session } = useSession()

  const setProductState = (prod: ProductType) => {
    const { category, ...productState } = prod
    setProduct(new Product(copy(productState), category))
  }

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
    setProductState(productMenu)
    setWeek(new Week(productMenu.disponibility.week))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productMenu])

  useEffect(() => {
    product.disponibility.week = week
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])

  const modalCrop = (
    <CropModal
      typeCrop="productImage"
      show={!!inputFileImage}
      inputFile={inputFileImage}
      setImageBlob={(blob, url) => {
        const image = document.getElementById(
          'productImage'
        ) as HTMLImageElement
        if (image) {
          image.src = url
        }
        setValue('image', url)
      }}
      onHide={() => {
        setInputFileImage(undefined)
        setShowSpinner(false)
      }}
    />
  )

  const resetState = () => {
    setNameInvalid(false)
    // setProductMenu(Product.newProduct(category))
    setEventKeyTab('details')
  }

  // const createOrUpdateProduct = async (e: FormEvent) => {
  //   e.preventDefault()
  //   const inputName = document.getElementById(
  //     `productName-${product?.id}`
  //   ) as HTMLInputElement
  //   const form = document.getElementById('form-products') as HTMLFormElement
  //   try {
  //     if (invalidWeek) {
  //       handleShowToast({
  //         type: `alert`,
  //         content: `${t('message_cannot_invalid_times')}.`,
  //         title: t('operating_hours'),
  //         size: 35,
  //       })
  //       return
  //     }

  //     const dataProducts = new FormData(form)

  //     if (!product?.name.trim().length) {
  //       setEventKeyTab('details')
  //       setNameInvalid(true)
  //       setTimeout(() => {
  //         inputName.focus()
  //       }, 20)
  //       return
  //     }

  //     if (product?.complements?.length) {
  //       if (
  //         verifyEmptyNameLength(product.complements, 'id', {
  //           partialQuery: `#complement-name-`,
  //           queryParentElement: `#create-product-modal`,
  //           differTop: 200,
  //         }) ||
  //         verifyEmptyNameLength(
  //           product.complements.flatMap((comp) => comp.itens.flat()),
  //           'code',
  //           {
  //             partialQuery: `#complement-item-`,
  //             queryParentElement: `#create-product-modal`,
  //             differTop: -200,
  //           }
  //         )
  //       ) {
  //         handleShowToast({
  //           type: 'alert',
  //           title: t('complements'),
  //           content: `${t('review_not_allowed')}.`,
  //         })
  //         setInvalidComplementName(true)
  //         return
  //       }

  //       // const complFindFather = product?.complements?.find(
  //       //   (compl) => compl.name.trim() === ""
  //       // );
  //       // const complFind = product?.complements?.find(
  //       //   (compl) =>
  //       //     compl.itens.filter((item) => item.name.trim() === "").length
  //       // );
  //       // if (complFindFather) {
  //       //   setInvalidComplementName(true);

  //       //   return;
  //       // }
  //       // if (complFind) {
  //       //   setInvalidItemName(true);
  //       //   return;
  //       // }
  //     }

  //     imageCropped && dataProducts.append('image', imageCropped)
  //     dataProducts.append('complements', copy(product.complements, 'json'))
  //     dataProducts.append('recicle', copy(recicledComplements, 'json'))
  //     dataProducts.append('disponibility', copy(product.disponibility, 'json'))
  //     dataProducts.append('promoteStatus', copy(product.promoteStatus, 'json'))
  //     dataProducts.append(
  //       'promoteStatusTable',
  //       copy(product.promoteStatusTable, 'json')
  //     )
  //     dataProducts.append('bypass_amount', copy(product.bypass_amount, 'json'))

  //     setShowSaveSpinner(true)

  //     if (type === 'update') {
  //       dataProducts.append('order', String(product.order))
  //       dataProducts.append(
  //         'removeComplements',
  //         copy(removeComplements, 'json')
  //       )
  //     } else {
  //       dataProducts.append('order', String(category?.products?.length ?? 0))
  //     }

  //     dataProducts.set('name', encryptEmoji(product.name))
  //     dataProducts.set('description', encryptEmoji(product.description))

  //     if (type === 'update') {
  //       const response = await Product.API({
  //         type: 'UPDATE',
  //         session,
  //         data: dataProducts,
  //         product: productMenu,
  //         categories,
  //         recicle: recicledComplements,
  //         setCategories,
  //       })
  //       if ('inventory' in response) setLowInventoryItems(response.inventory)
  //     }

  //     if (type === 'create') {
  //       const { data } = await api.post('/dashboard/products', dataProducts)
  //       console.log(data);

  //     }

  //     handleShowToast({
  //       position: 'middle-center',
  //       title: t('product'),
  //       content: `${product.name}, ${type === 'create' ? t('created_o') : t('updated_o')} ${t('successfully')}.`,
  //       type: 'success',
  //       show: true,
  //       delay: 1000,
  //     })
  //     setImageCroped(undefined)
  //     handleClose()
  //   } catch (e) {
  //     console.error(e)
  //     handleShowToast({
  //       position: 'middle-center',
  //       title: 'Produto',
  //       content: `${t('could_not')} ${type === 'create' ? t('create') : t('update')} ${t('the_product')}, ${product.name}.`,
  //       type: 'erro',
  //       show: true,
  //       delay: 1000,
  //     })
  //   } finally {
  //     setShowSaveSpinner(false)
  //   }
  // }

  const deleteProduct = () => {
    setShowSaveSpinner(true)
    handleConfirmModal({
      actionConfirm: async () => {
        try {
          await Product.API({
            type: 'DELETE',
            session,
            product: productMenu,
            categories,
            setCategories,
          })

          handleShowToast({
            position: 'middle-center',
            title: 'Produto',
            content: `${product.name}, ${t('was_deleted_successfully')}.`,
            type: 'success',
            show: true,
            delay: 1000,
          })

          handleClose()
        } catch (e) {
          console.error(e)
          handleShowToast({
            position: 'middle-center',
            title: t('product'),
            content: `${t('could_not_delete_product')}, ${product.name}.`,
            type: 'erro',
            show: true,
            delay: 1000,
          })
        }
        setShowSaveSpinner(false)
      },
      actionCancel: () => {
        setShowSaveSpinner(false)
      },
      title: t('product'),
      message: `${t('delete_the_product')}:
      ${product.name}?`,
    })
  }

  const handleSendForm = async (body: ProductFormData) => {
    if (type === 'create') {
      body.disponibility.week = new Week()
      const { data } = await api.post('/dashboard/products', body)
      console.log(data);

    }
  }

  useEffect(() => {
    let interval
    if (show && window.innerWidth < 450) {
      interval = setInterval(() => {
        const inputs = document.querySelectorAll(
          `[data-hidde-actions=products]`
        )
        inputs?.forEach((input: unknown) => {
          ; (input as HTMLElement).onfocus = () => setShowActionsButton(false)
            ; (input as HTMLElement).onblur = () => setShowActionsButton(true)
        })
      }, 5000)
    } else {
      if (interval) {
        clearInterval(interval)
      }
    }
  })

  console.log(watch())

  return (
    <div
      onKeyDown={(e) => {
        if (e.altKey) {
          switch (e.code) {
            case 'Enter':
              if (!invalidWeek) {
                // createOrUpdateProduct(e)
              }
              break
            case 'Digit1':
              setEventKeyTab('details')
              break
            case 'Digit2':
              setEventKeyTab('complements')
              break
            case 'Digit3':
              setEventKeyTab('promotion')
              break
            case 'Digit4':
              setEventKeyTab('disponibility')
              break
          }
        }
      }}
    >
      {modalCrop}
      <Modal
        show={show}
        onHide={() => {
          reset()
          handleClose()
        }}
        onExit={() => {
          setRecicledComplements([])
          setInvalidComplementName(false)
        }}
        keyboard
        scrollable
        backdrop={showSaveSpinner ? 'static' : undefined}
        dialogClassName={`${window.innerWidth > 768 ? 'modal-90' : ''} centered mx-auto`}
        fullscreen={window.innerWidth < 768 ? true : undefined}
        centered
        onExited={() => {
          resetState()
          setRemoveComplements([])
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {type === 'create' ? t('add') : t('edit')} {t('product')}{' '}
            {type === 'update' && `(${productMenu.name})`}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          id={`create-product-modal`}
          className={`position-relative`}
          style={{ height: '80vmin' }}
        >
          <form id="form-product" onSubmit={handleSubmit(handleSendForm)}>
            {showSpinner && (
              <div
                className="position-absolute d-flex justify-content-center align-items-center bottom-0 end-0 start-0 top-0"
                style={{ zIndex: 1000, background: 'rgba(255, 255, 255, .5)' }}
              >
                <Spinner animation="border" />
              </div>
            )}
            <Tab.Container id="requests-tabs" activeKey={eventKeyTab}>
              <Row>
                <Col sm={12}>
                  <Nav variant="tabs" className="tab-nav-flex flex-row">
                    <Nav.Item onClick={() => setEventKeyTab('details')}>
                      <Nav.Link eventKey="details">
                        {t('details')}
                        {eventKeyTab !== 'details' && nameInvalid && (
                          <span className="ms-2">
                            <BsExclamationCircle
                              className="pulseElement"
                              color="red"
                              size={20}
                            />
                          </span>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item onClick={() => setEventKeyTab('complements')}>
                      <Nav.Link eventKey="complements">
                        {t('complements')}
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item onClick={() => setEventKeyTab('promotion')}>
                      <Nav.Link eventKey="promotion">{t('promotion')}</Nav.Link>
                    </Nav.Item>
                    <Nav.Item onClick={() => setEventKeyTab('disponibility')}>
                      <Nav.Link eventKey="disponibility">
                        {t('availability')}
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    <Tab.Pane eventKey="details">
                      <Card className="mt-4">
                        <Card.Body>
                          <Container fluid className="mx-0 px-0">
                            <Row className="text-dark">
                              <Col
                                sm="12"
                                md="12"
                                lg="4"
                                className="d-flex flex-column justify-content-between mx-sm-auto mx-lg-0"
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  maxWidth:
                                    window.innerWidth >= 1024
                                      ? '400px'
                                      : undefined,
                                }}
                              >
                                <label
                                  className="cursor-pointer"
                                  htmlFor={`product-image-${productMenu.id}`}
                                >
                                  <Figure>
                                    <Figure.Image
                                      width={600}
                                      // height={450}
                                      alt="Imagem do Produto"
                                      src={
                                        product?.image || '/images/no-img.jpeg'
                                      }
                                      id="productImage"
                                      style={{
                                        /* objectFit: "cover",*/ maxHeight: 270,
                                      }}
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
                                      accept="image/*"
                                      id={`product-image-${productMenu.id}`}
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
                                </label>
                              </Col>
                              <Col sm="12" md="12" lg className="my-auto">
                                <Row>
                                  <Col sm>
                                    <Form.Label>
                                      <b>{t('name')}</b>
                                    </Form.Label>
                                    <div className="position-relative">
                                      <Form.Control
                                        id={`productName-${product?.id}`}
                                        autoFocus
                                        isInvalid={nameInvalid}
                                        maxLength={55}
                                        {...register('name')}
                                      />
                                      <Form.Control.Feedback
                                        tooltip
                                        type="invalid"
                                        style={{ zIndex: 0 }}
                                      >
                                        {t('please_valid_name')}!
                                      </Form.Control.Feedback>
                                    </div>
                                    <div className="d-flex justify-content-end">
                                      <p
                                        className={
                                          (watch('name')?.length || 0) >= 55
                                            ? 'text-red-500'
                                            : ''
                                        }
                                      >
                                        {watch('name')?.length || 0}/55{' '}
                                        {t('characters')}
                                      </p>
                                    </div>
                                  </Col>
                                  <Col sm>
                                    <Form.Label>
                                      <b>Código NCM</b>
                                    </Form.Label>
                                    <Form.Select
                                      {...register('ncm_code')}
                                    >
                                      <option disabled value={''}>
                                        Selecione
                                      </option>
                                    </Form.Select>
                                  </Col>
                                  <Col sm>
                                    <Form.Label>
                                      <b>{t('category')}</b>
                                    </Form.Label>
                                    <Form.Select
                                      value={watch('categoryId')}
                                      {...register('categoryId')}
                                    >
                                      {categories
                                        .filter((c) => c.type === 'default')
                                        .map((category) => (
                                          <option
                                            key={`${category.id}-${hash()}`}
                                            value={String(category.id)}
                                          >
                                            {category.name}
                                          </option>
                                        ))}
                                    </Form.Select>
                                  </Col>
                                </Row>

                                <Row className="mb-4">
                                  {(plansCategory.includes('basic') ||
                                    plansCategory.includes('package')) && (
                                      <Col sm="6">
                                        <Form.Label>
                                          <b className="text-nowrap">
                                            {t('price')}{' '}
                                            {plansCategory.includes('basic') &&
                                              plansCategory.includes('package')
                                              ? `${labels.basic}/${labels.package}`
                                              : plansCategory.includes('basic')
                                                ? labels.basic
                                                : labels.package}
                                          </b>
                                        </Form.Label>
                                        <InputGroup className="position-relative">
                                          <InputGroup.Text>
                                            {currency({ value: 0, symbol: true })}
                                          </InputGroup.Text>
                                          <Form.Control
                                            required
                                            defaultValue={(
                                              product?.value ?? 0
                                            ).toFixed(2)}
                                            {...register('value', {
                                              onChange: (e) => mask(e, 'currency')
                                            })}
                                          />
                                          <Form.Control.Feedback
                                            tooltip
                                            type="invalid"
                                          >
                                            {t('enter_valid_value')}
                                          </Form.Control.Feedback>
                                        </InputGroup>
                                      </Col>
                                    )}
                                  {plansCategory.includes('table') && (
                                    <Col sm="6">
                                      <Form.Label>
                                        <b className="text-nowrap">
                                          {t('price')} {labels.table}
                                        </b>
                                      </Form.Label>
                                      <InputGroup className="position-relative">
                                        <InputGroup.Text>
                                          {currency({ value: 0, symbol: true })}
                                        </InputGroup.Text>
                                        <Form.Control
                                          defaultValue={(
                                            product?.valueTable ?? 0
                                          ).toFixed(2)}
                                          {...register('valueTable', {
                                            onChange: (e) => mask(e, 'currency')
                                          })}
                                        />
                                        <Form.Control.Feedback
                                          tooltip
                                          type="invalid"
                                        >
                                          {t('enter_valid_value')}
                                        </Form.Control.Feedback>
                                      </InputGroup>
                                    </Col>
                                  )}
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
                                          disabled={!watch('bypass_amount')}
                                          onClick={() => {
                                            setValue('amount', Number(watch('amount')) <= 0 ? 0 : Number(watch('amount')) - 1)
                                          }}
                                        >
                                          -
                                        </Button>
                                        <Form.Control
                                          disabled={!watch('bypass_amount')}
                                          {...register('amount')}
                                        />
                                        <Button
                                          variant="secondary"
                                          disabled={!watch('bypass_amount')}
                                          className="rounded-end"
                                          style={{ minWidth: '34.75px' }}
                                          onClick={() => {
                                            setValue('amount', Number(watch('amount')) + 1)
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
                                          variant="secondary"
                                          disabled={!watch('bypass_amount')}
                                          onClick={() => {
                                            setValue('amount_alert', Number(watch('amount_alert')) <= 0 ? 0 : watch('amount_alert') - 1)
                                          }}
                                        >
                                          -
                                        </Button>
                                        <Form.Control
                                          disabled={!watch('bypass_amount')}
                                          {...register('amount_alert')}
                                        />
                                        <Button
                                          variant="secondary"
                                          disabled={!watch('bypass_amount')}
                                          className="rounded-end"
                                          style={{ minWidth: '34.75px' }}
                                          onClick={() => {
                                            setValue('amount_alert', Number(watch('amount_alert')) + 1)
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
                                        <Form.Label className='d-flex align-items-center'>
                                          <Form.Check
                                            type="switch"
                                            className="fs-6 text-nowrap"
                                            defaultChecked={
                                              !!product.bypass_amount
                                            }
                                            {...register('bypass_amount')}
                                          />
                                          <span>{t('always_available')}</span>
                                        </Form.Label>
                                      </FormGroup>
                                    </Col>
                                  </Row>
                                ) : null}

                                <Row>
                                  <Col sm className="d-flex flex-column mt-4">
                                    <Form.Label>
                                      <b>{t('description')}</b>
                                    </Form.Label>
                                    <Form.Control
                                      as="textarea"
                                      rows={5}
                                      maxLength={500}
                                      {...register('description')}
                                    />
                                    <div className="d-flex justify-content-end">
                                      <p
                                        className={
                                          product.description?.length >= 500
                                            ? 'text-red-500'
                                            : ''
                                        }
                                      >
                                        {product.description?.length || 0}
                                        /500 {t('characters')}
                                      </p>
                                    </div>
                                  </Col>
                                </Row>
                              </Col>
                            </Row>
                          </Container>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                    <Tab.Pane eventKey="complements">
                      <br />
                      <FormProvider {...form}>
                        <ComponentComplement
                          typeModal="product"
                          complementType="default"
                          // complements={product?.complements || []}
                          // recicled={recicledComplements}
                          // saveComplements={(newComplements) => {
                          //   setProduct({
                          //     ...product,
                          //     complements: newComplements,
                          //   })
                          // }}
                          // saveRecicledComplements={(recicled) =>
                          //   setRecicledComplements([...recicled])
                          // }
                          // saveRemovedComplements={(removeds) =>
                          //   setRemoveComplements([...removeds])
                          // }
                          invalidComplement={invalidComplementName}
                        />
                      </FormProvider>
                    </Tab.Pane>
                    <Tab.Pane eventKey="promotion">
                      <Card className="wm-default text-dark mt-4">
                        <Card.Header className="d-flex gap-3">
                          <h4>{t('promotion')}</h4>
                          <div className="vr"></div>
                          <HelpVideos.Trigger
                            urls={[
                              {
                                src: 'https://www.youtube.com/embed/gElW2BNbPTM',
                                title: t('promotion'),
                              },
                            ]}
                          />
                        </Card.Header>
                        <Card.Body>
                          {(plansCategory.includes('basic') ||
                            plansCategory.includes('package')) && (
                              <Row>
                                <Col sm>
                                  <div className="d-flex justify-content-end mt-4 flex-row-reverse gap-2">
                                    <Form.Label htmlFor="promotion">
                                      <p>
                                        <b>
                                          {t('activate_promotion')}{' '}
                                          {plansCategory.includes('basic') &&
                                            plansCategory.includes('package')
                                            ? `${labels.basic}/${labels.package}`
                                            : plansCategory.includes('basic')
                                              ? labels.basic
                                              : labels.package}
                                        </b>
                                      </p>
                                      <p>
                                        {t('button_enable_disable_promotion')}
                                      </p>
                                    </Form.Label>
                                    <Form.Switch
                                      id="promotion"
                                      {...register('promoteStatus')}
                                    />
                                  </div>
                                </Col>
                                <Col sm>
                                  <Card>
                                    <Card.Body>
                                      <p>
                                        {t('original_price')}:{' '}
                                        {currency({ value: watch('value') })}
                                      </p>
                                      <div className="d-flex align-items-baseline gap-3">
                                        <Form.Label>
                                          <b className="text-nowrap">
                                            {t('promotional_price')}:
                                          </b>
                                        </Form.Label>
                                        <Form.Control
                                          {...register('promoteValue', {
                                            onChange: (e) => mask(e, 'currency')
                                          })}
                                          className="w-75"
                                        />
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              </Row>
                            )}
                          {plansCategory.includes('table') && (
                            <Row>
                              <Col sm>
                                <div className="d-flex justify-content-end mt-4 flex-row-reverse gap-2">
                                  <Form.Label htmlFor="promotionTable">
                                    <p>
                                      <b>
                                        {t('activate_promotion')}{' '}
                                        {plansCategory.every(
                                          (p) => p === 'table'
                                        )
                                          ? ''
                                          : t('table')}
                                      </b>
                                    </p>
                                    <p>
                                      {t('button_enable_disable_promotion')}
                                    </p>
                                  </Form.Label>
                                  <Form.Switch
                                    id="promotionTable"
                                    {...register('promoteStatusTable')}
                                  />
                                </div>
                              </Col>
                              <Col sm>
                                <Card>
                                  <Card.Body>
                                    <p>
                                      {t('original_price')}:{' '}
                                      {currency({ value: product.valueTable })}
                                    </p>
                                    <div className="d-flex align-items-baseline gap-3">
                                      <Form.Label>
                                        <b className="text-nowrap">
                                          {t('promotional_price')}:
                                        </b>
                                      </Form.Label>
                                      <Form.Control
                                        className="w-75"
                                        {...register('promoteValueTable', {
                                          onChange: (e) => mask(e, 'currency')
                                        })}
                                      />
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                          )}
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                    <Tab.Pane eventKey="disponibility">
                      <Card className="mt-4">
                        <Card.Header>
                          <h4>
                            <b>{t('available_for')}:</b>
                          </h4>
                        </Card.Header>
                        <Card.Body>
                          <Container fluid className="mx-0 px-0">
                            <Row className="text-dark">
                              <Col sm>
                                <h6 className="mb-4"></h6>
                                <div className="d-flex gap-3">
                                  {plansCategory.includes('basic') && (
                                    <div className="d-flex flex-column align-items-center">
                                      <Form.Label>
                                        Delivery
                                        <Form.Switch
                                          className="pt-2"
                                          defaultChecked={
                                            product?.disponibility?.store
                                              .delivery
                                          }
                                          onChange={(e) => {
                                            setProduct({
                                              ...product,
                                              disponibility: {
                                                ...product.disponibility,
                                                store: {
                                                  ...product.disponibility
                                                    .store,
                                                  delivery: e.target.checked,
                                                },
                                              },
                                            })
                                          }}
                                        />
                                      </Form.Label>
                                    </div>
                                  )}
                                  {plansCategory.includes('table') && (
                                    <div className="d-flex flex-column align-items-center">
                                      <Form.Label>
                                        {t('table')}
                                        <Form.Switch
                                          className="pt-2"
                                          defaultChecked={
                                            product?.disponibility?.store.table
                                          }
                                          onChange={(e) => {
                                            setProduct({
                                              ...product,
                                              disponibility: {
                                                ...product.disponibility,
                                                store: {
                                                  ...product.disponibility
                                                    .store,
                                                  table: e.target.checked,
                                                },
                                              },
                                            })
                                          }}
                                        />
                                      </Form.Label>
                                    </div>
                                  )}
                                  {plansCategory.includes('package') && (
                                    <div className="d-flex flex-column align-items-center">
                                      <Form.Label className="text-center">
                                        {t('package')}
                                        <Form.Switch
                                          className="pt-2"
                                          defaultChecked={
                                            product?.disponibility?.store
                                              .package
                                          }
                                          onChange={(e) => {
                                            setProduct({
                                              ...product,
                                              disponibility: {
                                                ...product.disponibility,
                                                store: {
                                                  ...product.disponibility
                                                    .store,
                                                  package: e.target.checked,
                                                },
                                              },
                                            })
                                          }}
                                        />
                                      </Form.Label>
                                    </div>
                                  )}
                                </div>
                              </Col>
                            </Row>
                          </Container>
                        </Card.Body>
                      </Card>
                      <Dates
                        type="menu"
                        title={t('add_availability_hours')}
                        week={product.disponibility?.week}
                        setInvalidWeek={setInvalidWeek}
                        setWeek={setWeek}
                      />
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </form>
        </Modal.Body>
        <Modal.Footer
          className={`${type === 'update' ? 'justify-content-between' : undefined} position-relative ${modalFooterOpened ? 'show' : 'hidden'
            }-buttons-modal-footer`}
        >
          <ArrowModalFooter />
          <Button variant='success' form='form-product' type='submit' >{type === 'update' ? t('save') : t('create')}</Button>
          {/* {showActionsButton && (
            <ActionsFooterButton
              type={type}
              disabledButtonSave={nameInvalid}
              // createOrUpdate={createOrUpdateProduct}
              deleteFunction={deleteProduct}
              handleClose={handleClose}
            />
          )} */}
        </Modal.Footer>
        <OverlaySpinner
          show={showSaveSpinner}
          width={100}
          weight={10}
          backgroundColor="transparent"
          backdropBlur={0.7}
          className="fs-2"
          textSpinner={t('please_wait')}
        />
      </Modal>
    </div>
  )
}
