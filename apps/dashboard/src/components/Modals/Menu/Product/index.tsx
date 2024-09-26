import { HelpVideos } from '@components/Modals/HelpVideos'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useContext, useEffect, useState } from 'react'
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
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsExclamationCircle } from 'react-icons/bs'
import { api } from 'src/lib/axios'
import { z } from 'zod'
import { AppContext } from '../../../../context/app.ctx'
import { MenuContext } from '../../../../context/menu.ctx'
import Week from '../../../../types/dates'
import { apiRoute, hash, mask } from '../../../../utils/wm-functions'
import { Dates } from '../../../Dates'
import { ArrowModalFooter } from '../../../Generic/ArrowsModalFooter'
import { OverlaySpinner } from '../../../OverlaySpinner'
import { CropModal } from '../../CropModal'
import { ComplementFormSchema, ComponentComplement } from '../Complements'
import Product, { ProductType } from '../../../../types/product'
import { useSession } from 'next-auth/react'
import { groveNfeApi } from 'src/lib/axios'
import { Ncm } from '../../../../types/nfce'

const ProductFormSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number(),
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(55, 'O nome deve ter no máximo 55 caracteres'),
  description: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres')
    .nullable(),
  value: z.number().transform((value) => parseFloat(Number(value).toFixed(2))),
  promoteValue: z
    .number()
    .transform((value) => parseFloat(Number(value).toFixed(2))),
  valueTable: z
    .number()
    .transform((value) => parseFloat(Number(value).toFixed(2))),
  promoteValueTable: z
    .number()
    .transform((value) => parseFloat(Number(value).toFixed(2))),
  promoteStatus: z.boolean().default(false),
  promoteStatusTable: z.boolean().default(false),
  order: z.number(),
  image: z
    .string()
    .nullable()
    .transform((value) => value && value.split(',')[1]),
  imageName: z
    .string()
    .optional()
    .transform(
      (value) =>
        value &&
        value
          .split('.')[0]
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(' ', '_')
    ),
  bypass_amount: z.boolean().default(true),
  amount: z.number(),
  amount_alert: z.number(),
  ncm_code: z.string().optional(),
  disponibility: z.object({
    week: z.any(),
    store: z.object({
      delivery: z.boolean(),
      package: z.boolean(),
      table: z.boolean(),
    }),
  }),
  complements: ComplementFormSchema.array(),
})

type ProductFormData = z.infer<typeof ProductFormSchema>

interface ProductProps {
  show: boolean
  handleClose: () => void
  type: 'create' | 'update'
}

export function ProductModal({ show, handleClose }: ProductProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const {
    profile,
    plansCategory,
    modalFooterOpened,
    currency,
    handleShowToast,
    setLowInventoryItems,
  } = useContext(AppContext)
  const {
    product,
    category,
    categories,
    typeModal: type,
    setCategories,
    setProduct,
  } = useContext(MenuContext)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      categoryId: product?.categoryId || category?.id || 0,
      amount: product?.amount || 0,
      amount_alert: product?.amount_alert || 0,
      description: product?.description || null,
      complements: product?.complements || [],
      order: product.order || category?.products?.length || 0 + 1,
      value: product?.value || 0,
      valueTable: product?.valueTable || 0,
      promoteValue: product?.promoteValue || 0,
      promoteValueTable: product?.promoteValueTable || 0,
      promoteStatus: Boolean(product?.promoteStatus) || false,
      promoteStatusTable: Boolean(product?.promoteStatusTable) || false,
      bypass_amount: Boolean(product?.bypass_amount) || true,
      name: product?.name,
      ncm_code: product?.ncm_code,
      disponibility: {
        store: {
          delivery: product?.disponibility?.store?.delivery || true,
          table: product?.disponibility?.store?.table || true,
          package: product?.disponibility?.store?.package || true,
        },
      },
    },
  })

  const { register, handleSubmit, watch, setValue, reset, formState } = form
  const { ncm_code } = watch()
  const [fetchNcm, setFetchNcm] = useState(false)
  //PROPRIEDADES DO PRODUTO
  const [showSaveSpinner, setShowSaveSpinner] = useState<boolean>(false)
  const [invalidWeek, setInvalidWeek] = useState<boolean>(false)
  const [showSpinner, setShowSpinner] = useState<boolean>(false)

  const [eventKeyTab, setEventKeyTab] = useState<
    'details' | 'complements' | 'promotion' | 'disponibility'
  >('details')
  const [week, setWeek] = useState<Week>(new Week(product.disponibility.week))

  const [inputFileImage, setInputFileImage] = useState<HTMLInputElement>()

  const [ncmList, setNcmList] = useState([] as Ncm[])

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

  const handleSendForm = async (body: ProductFormData) => {
    setShowSpinner(true)
    try {
      const { data } = await api[type === 'create' ? 'post' : 'put'](
        '/dashboard/products',
        body
      )
      setCategories((state) => {
        return state.map((category) => {
          switch (type) {
            case 'create':
              if (category.id === data.product.categoryId) {
                category.products?.push(new Product(data.product))
              }
              break
            case 'update':
              if (category.id === data.product.categoryId) {
                category.products = category.products?.map((product) =>
                  product.id === body.id
                    ? new Product({ ...product, ...body } as ProductType)
                    : product
                )
              }
              break
          }
          return category
        })
      })
      setProduct(new Product({ ...product, ...body } as ProductType))

      setLowInventoryItems(data.inventory)
      handleShowToast({
        position: 'middle-center',
        title: t('product'),
        content: `${data.product.name}, ${type === 'create' ? t('created_o') : t('updated_o')} ${t('successfully')}.`,
        type: 'success',
        show: true,
        delay: 1000,
      })
    } catch (error) {
      console.error(error)
      handleShowToast({
        position: 'middle-center',
        title: 'Produto',
        content: `${t('could_not')} ${type === 'create' ? t('create') : t('update')} ${t('the_product')}, ${product.name}.`,
        type: 'erro',
        show: true,
        delay: 1000,
      })
    } finally {
      setShowSpinner(false)
      reset()
      handleClose()
    }
  }

  const handleDelete = async () => {
    await apiRoute(
      `/dashboard/menu/product/${product.id}/delete`,
      session,
      'DELETE'
    )
    setCategories((state) => {
      return state.map((category) => {
        category.products = category.products?.filter(
          (p) => p.id !== product.id
        )
        return category
      })
    })
    handleClose()
  }

  const handleNcmList = useCallback(async () => {
    if (ncm_code && fetchNcm) {
      let params: { codigo?: string; descricao?: string } = {}

      if (/\d+/g.test(ncm_code)) {
        params.codigo = ncm_code
      }
      if (/\D+/g.test(ncm_code)) {
        params.descricao = ncm_code
      }

      setShowSpinner(true)

      try {
        const response = await groveNfeApi.get(`v1/fiscalNotes/list/ncms`, {
          params,
        })

        if (response.data) {
          setNcmList(response.data.data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setShowSpinner(false)
      }
    }
  }, [ncm_code, setNcmList, fetchNcm])

  useEffect(() => {
    setValue('disponibility.week', week)
  }, [week, setValue])

  useEffect(() => {
    reset({
      id: product.id,
      name: product.name,
      image: product.image,
      amount: product.amount,
      amount_alert: product.amount_alert,
      description: product.description,
      complements: product.complements.map((comp) => ({
        ...comp,
        required: Boolean(comp.required),
      })),
      order: product.order,
      value: product.value,
      valueTable: product.valueTable,
      promoteValue: product.promoteValue,
      promoteValueTable: product.promoteValueTable,
      promoteStatus: Boolean(product.promoteStatus),
      promoteStatusTable: Boolean(product.promoteStatusTable),
      bypass_amount: Boolean(product.bypass_amount),
      disponibility: product.disponibility,
      ncm_code: product.ncm_code,
    })
  }, [product, setValue, reset])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ncm_code) {
        handleNcmList()
      }
    }, 1000 * 1.5)

    return () => clearTimeout(timer)
  }, [ncm_code, handleNcmList])

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
      <Modal
        show={show}
        onHide={() => {
          reset()
          handleClose()
        }}
        keyboard
        scrollable
        backdrop={showSaveSpinner ? 'static' : undefined}
        dialogClassName={`${window.innerWidth > 768 ? 'modal-90' : ''} centered mx-auto`}
        fullscreen={window.innerWidth < 768 ? true : undefined}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {type === 'create' ? t('add') : t('edit')} {t('product')}{' '}
            {type === 'update' && `(${product.name})`}
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
                        {eventKeyTab !== 'details' && formState.errors.name && (
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
                                  htmlFor={`product-image-${product.id}`}
                                >
                                  <Figure>
                                    <Figure.Image
                                      width={600}
                                      alt="Imagem do Produto"
                                      src={
                                        watch('image') || '/images/no-img.jpeg'
                                      }
                                      id="productImage"
                                      style={{
                                        maxHeight: 270,
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
                                      id={`product-image-${product.id}`}
                                      onChange={(e) => {
                                        setValue(
                                          'imageName',
                                          (e.target as HTMLInputElement)
                                            .files?.[0].name
                                        )
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
                                        isInvalid={Boolean(
                                          formState.errors.name
                                        )}
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
                                  {profile.options?.integrations?.grovenfe && (
                                    <Col sm>
                                      <Form.Label>
                                        <b>Código NCM</b>
                                      </Form.Label>
                                      <Form.Control
                                        list="ncm"
                                        {...register('ncm_code', {
                                          onChange: () => {
                                            setFetchNcm(true)
                                          }
                                        })}
                                        placeholder="Selecione"
                                      />
                                      <datalist id="ncm">
                                        {ncmList.map((ncm) => (
                                          <option
                                            key={ncm.codigo}
                                            value={ncm.codigo}
                                          >
                                            {ncm.descricao_completa}
                                          </option>
                                        ))}
                                      </datalist>
                                    </Col>
                                  )}
                                  <Col sm>
                                    <Form.Label>
                                      <b>{t('category')}</b>
                                    </Form.Label>
                                    <Form.Select
                                      value={
                                        watch('categoryId') ||
                                        product?.categoryId ||
                                        0
                                      }
                                      {...register('categoryId', {
                                        valueAsNumber: true,
                                      })}
                                    >
                                      {categories
                                        .filter((c) => c.type === 'default')
                                        .map((category) => (
                                          <option
                                            key={`${category.id}-${hash()}`}
                                            value={category.id}
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
                                            {...register('value', {
                                              valueAsNumber: true,
                                              onChange: (e) =>
                                                mask(e, 'currency'),
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
                                          {...register('valueTable', {
                                            valueAsNumber: true,
                                            onChange: (e) =>
                                              mask(e, 'currency'),
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
                                          disabled={watch('bypass_amount')}
                                          onClick={() => {
                                            setValue(
                                              'amount',
                                              Number(watch('amount')) <= 0
                                                ? 0
                                                : Number(watch('amount')) - 1
                                            )
                                          }}
                                        >
                                          -
                                        </Button>
                                        <Form.Control
                                          disabled={watch('bypass_amount')}
                                          {...register('amount')}
                                        />
                                        <Button
                                          variant="secondary"
                                          disabled={watch('bypass_amount')}
                                          className="rounded-end"
                                          style={{ minWidth: '34.75px' }}
                                          onClick={() => {
                                            setValue(
                                              'amount',
                                              Number(watch('amount')) + 1
                                            )
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
                                          disabled={watch('bypass_amount')}
                                          onClick={() => {
                                            setValue(
                                              'amount_alert',
                                              Number(watch('amount_alert')) <= 0
                                                ? 0
                                                : watch('amount_alert') - 1
                                            )
                                          }}
                                        >
                                          -
                                        </Button>
                                        <Form.Control
                                          disabled={watch('bypass_amount')}
                                          {...register('amount_alert')}
                                        />
                                        <Button
                                          variant="secondary"
                                          disabled={watch('bypass_amount')}
                                          className="rounded-end"
                                          style={{ minWidth: '34.75px' }}
                                          onClick={() => {
                                            setValue(
                                              'amount_alert',
                                              Number(watch('amount_alert')) + 1
                                            )
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
                                        <Form.Label className="d-flex align-items-center">
                                          <Form.Check
                                            type="switch"
                                            className="fs-6 text-nowrap"
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
                                          (watch('description')?.length || 0) >=
                                            500
                                            ? 'text-red-500'
                                            : ''
                                        }
                                      >
                                        {watch('description')?.length || 0}
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
                                            onChange: (e) => mask(e, 'currency'),
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
                                      {currency({ value: watch('valueTable') })}
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
                                          onChange: (e) => mask(e, 'currency'),
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
                                          {...register(
                                            'disponibility.store.delivery'
                                          )}
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
                                          {...register(
                                            'disponibility.store.table'
                                          )}
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
                                          {...register(
                                            'disponibility.store.package'
                                          )}
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
                        week={product.disponibility?.week || new Week()}
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
          <div className="d-flex align-items-center w-100 gap-2">
            {type === 'update' && (
              <Button
                variant="outline-danger"
                form="form-product"
                onClick={handleDelete}
              >
                {t('delete')}
              </Button>
            )}
            <div className="d-flex align-items-center ms-auto gap-2">
              <Button
                variant="danger"
                form="form-product"
                onClick={handleClose}
              >
                {t('cancel')}
              </Button>
              <Button variant="success" form="form-product" type="submit">
                {type === 'update' ? t('save') : t('create')}
              </Button>
            </div>
          </div>
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
