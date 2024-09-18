import {
  useContext,
  useEffect,
  useState
} from 'react'
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  InputGroup,
  OverlayTrigger,
  Popover,
  Row
} from 'react-bootstrap'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FaSyncAlt } from 'react-icons/fa'
import { RiErrorWarningFill } from 'react-icons/ri'
import { z } from 'zod'
import { AppContext } from '../../../../context/app.ctx'
import { MenuContext } from '../../../../context/menu.ctx'
import {
  hash
} from '../../../../utils/wm-functions'
import { HelpVideos } from '../../HelpVideos'
import { ComplementItems } from './ComplementItems'

export const ComplementFormSchema = z.object({
  id: z.number().transform((value) => {
    const parsedId = Number(value)
    if (isNaN(parsedId)) {
      return undefined
    }
    return parsedId
  }).optional(),
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(50, 'O nome deve ter no maúximo 50 caracteres'),
  required: z.boolean(),
  type: z.enum(['default', 'pizza']),
  min: z.number().max(10000),
  max: z.number().max(10000),
  order: z.number(),
  itens: z
    .array(
      z.object({
        id: z.string().optional(),
        amount: z.number().max(10000),
        amount_alert: z.number().min(0).max(10000),
        bypass_amount: z.boolean(),
        code: z.string(),
        status: z.boolean(),
        name: z
          .string()
          .min(3, 'O nome deve ter pelo menos 3 caracteres')
          .max(70, 'O nome deve ter no maúximo 70 caracteres'),
        description: z.string().max(100, 'A descrição deve ter no maúximo 100 caracteres').nullable(),
        customId: z.string().optional(),
        value: z.number().transform((value) => parseFloat(Number(value).toFixed(2))),
      })
    ),
})

export type ComplementFormData = z.infer<typeof ComplementFormSchema> & { created_at?: string, originalId?: number, isDraft?: boolean }
type ComplementProps = {
  showVinculateComplement?: boolean
  typeModal: 'massive' | 'product'
  invalidComplement?: boolean
  complementType: 'default' | 'pizza'
}
export function ComponentComplement({
  typeModal,
  showVinculateComplement,
  invalidComplement,
  complementType,
}: ComplementProps) {
  const { watch, control, register, setValue } = useFormContext<{ complements: ComplementFormData[] }>()
  const { append: appendComplement, remove: removeComplement, fields: complements, update: updateComplement } = useFieldArray({
    control,
    name: 'complements',
    keyName: 'customId'
  })

  const { t } = useTranslation()
  const { handleConfirmModal } = useContext(AppContext)
  const {
    productComplements,
    pizzaComplements,
    products,
    categories,
    componentIsLinked,
  } = useContext(MenuContext)

  const [removeComplements, setRemoveComplements] = useState<number[]>([])

  const [invalidComplementName, setInvalidComplementName] =
    useState<boolean>(false)

  let allComplements =
    complementType === 'default' ? productComplements : pizzaComplements


  useEffect(() => {
    setInvalidComplementName(!!invalidComplement)
  }, [invalidComplement])

  useEffect(() => {
    const setComplements = new Set()
    allComplements?.forEach((complement) => {
      if (complement.id && !removeComplements.includes(complement.id)) {
        setComplements.add(complement.id)
      }
    })

  }, [allComplements, removeComplements])

  const handleAddComplement = () => {
    appendComplement({
      name: '',
      itens: [],
      max: 0,
      min: 0,
      required: false,
      order: 0,
      type: complementType,
      isDraft: true,
    })
  }

  const handleCopyComplement = () => {
    appendComplement({
      originalId: allComplements[0].id,
      id: undefined,
      isDraft: true,
      itens: allComplements[0].itens.map((item) => ({
        ...item,
        amount: item.amount ?? 0,
        amount_alert: item.amount_alert ?? 0,
        bypass_amount: item.bypass_amount ?? false,
        status: Boolean(item.status),
      })),
      max: allComplements[0].max,
      min: allComplements[0].min,
      name: allComplements[0].name,
      order: allComplements[0].order,
      required: Boolean(allComplements[0].required),
      type: allComplements[0].type,
      created_at: allComplements[0].created_at,
    })
  }

  const handleAddItemComplement = (index: number, complement: ComplementFormData) => {
    complement.itens.push({
      name: '',
      description: '',
      amount: 0,
      bypass_amount: false,
      code: hash(6),
      status: true,
      value: 0,
      amount_alert: 0,
    })
    updateComplement(index, complement)
  }

  const handleRemoveComplement = (index: number) => {
    removeComplement(index)
  }

  return (
    <Card>
      <Card.Header
        style={{
          position: window.innerWidth > 768 ? 'sticky' : 'relative',
          top: '-16px',
          zIndex: 99999,
        }}
      >
        <div className="d-flex justify-content-between">
          <div className="position-relative d-flex flex-column flex-md-row gap-2">
            <Button
              variant="dark"
              className="text-wrap p-2"
              onClick={handleAddComplement}
            >
              + {t('category')}
            </Button>
            <Button
              variant="dark"
              className="text-wrap p-2"
              disabled={!allComplements.length}
              onClick={handleCopyComplement}
            >
              <FaSyncAlt />
              {t('use_addons_another_item')}
            </Button>
          </div>
          <HelpVideos.Trigger
            urls={[
              {
                src: 'https://www.youtube.com/embed/AZowVbOpIvw',
                title: t('creating_addons'),
              },
              {
                src: 'https://www.youtube.com/embed/cPXbA7NRmqs',
                title: t('shared_addons'),
              },
            ]}
          />
        </div>
      </Card.Header>
      <Card.Body>
        {complements.map((complement, index) => {
          return complement.isDraft && complement.created_at ? (
            <Card
              className="wm-default text-dark"
            >
              <Card.Body>
                <Row className="align-items-end">
                  <Col sm="6">
                    <Form.Label>
                      <b>{t('complement')}:</b>
                    </Form.Label>
                    <Form.Select
                      {...register(`complements.${index}.originalId`, {
                        valueAsNumber: true,
                      })}
                    >
                      {allComplements.map((complement, index) => (
                        <option
                          key={`${complement.id}-${index}`}
                          value={`${complement.id}`}
                        >
                          {`${complement.name} - [${complementType === 'default'
                            ? products.find(
                              (prod) => prod.id === complement.pivot?.productId
                            )?.name
                            : categories.find((cat) =>
                              cat.product?.complements.some(
                                (comp) => comp.id === complement.id
                              )
                            )?.name
                            }]`}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col sm="2" className="d-flex">
                    <OverlayTrigger
                      overlay={
                        <Popover id="popover-basic">
                          <Popover.Header as="h3">
                            <RiErrorWarningFill className="text-warning" />
                            <b> {t('attention')}</b>
                          </Popover.Header>
                          <Popover.Body>
                            {t('all_changes_addon_affect_other_product')}
                          </Popover.Body>
                        </Popover>
                      }
                    >
                      <div className="d-flex justify-content-end mt-auto flex-row-reverse gap-2">
                        <Form.Label htmlFor={`linked-${index}`}>
                          {t('link')}?
                        </Form.Label>
                        <Form.Switch
                          checked={Boolean(complement.id)}
                          className="flex-grow-1"
                          onChange={(e) => {
                            updateComplement(index, {
                              ...complement,
                              id: e.target.checked ? complement.originalId : undefined,
                            })
                          }}
                        />
                      </div>
                    </OverlayTrigger>
                  </Col>
                  <Col sm="4" className="d-flex gap-2">
                    <ButtonGroup className="flex-grow-1 d-flex gap-2">
                      <Button
                        className="my-auto"
                        onClick={() => {
                          updateComplement(index, {
                            ...complement,
                            isDraft: false,
                          })
                        }}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-grow-1 mt-auto"
                        onClick={() => {
                          handleRemoveComplement(index)
                        }}
                      >
                        {t('delete')}
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ) : (
            <Card
              className={`wm-default text-dark ${componentIsLinked({ complementId: complement.id }) ? 'linked-component' : ''}`}
            >
              {componentIsLinked({ complementId: complement.id }) && (
                <div className="link-alert-component">
                  {t('attention_addon_linked')} {t('other')}(s) {t('product_m')}
                  (s), {t('attention_addon_linked_v2')}
                </div>
              )}
              <Card.Body>
                <Row>
                  <Col sm>
                    <div className="d-flex justify-content-end align-items-center">
                      {typeModal === 'massive' && showVinculateComplement && (
                        <OverlayTrigger
                          overlay={
                            <Popover id="popover-basic">
                              <Popover.Header as="h3">
                                <RiErrorWarningFill className="text-warning" />
                                <b> {t('attention')}</b>
                              </Popover.Header>
                              <Popover.Body>
                                {t('all_changes_addon_affect_other_product')}
                              </Popover.Body>
                            </Popover>
                          }
                        >
                          <div className="d-flex flex-row-reverse gap-2">
                            <Form.Switch
                              id="Vincular"
                              label="Vincular Todos Produtos"
                              className="flex-grow-1"
                            />
                          </div>
                        </OverlayTrigger>
                      )}
                      {typeModal !== 'massive' &&
                        componentIsLinked({ complementId: complement.id }) && (
                          <Button
                            variant="link text-decoration-none"
                            className="mb-3"
                            onClick={() => {
                              handleConfirmModal({
                                show: true,
                                title: 'Produtos Vinculados',
                                message: `${products
                                  .filter((prod) =>
                                    prod.complements?.find(
                                      (compl) => compl.id === complement.id
                                    )
                                  )
                                  .map((prod, index, arr) => {
                                    if (index === 0 && arr.length === 1) {
                                      return `<span>${prod.name}</span>`
                                    }

                                    return `<span>${prod.name}</span><br />`
                                  })
                                  .join('')}`,
                                alignText: 'start',
                                cancelButton: 'none',
                                confirmButton: t('close'),
                              })
                            }}
                          >
                            {t('view_linked_products')}
                          </Button>
                        )}
                    </div>
                    <div className="d-flex gap-4">
                      <div className="flex-grow-1 mb-3">
                        <Form.Label>
                          <b>{t('name')}</b>
                        </Form.Label>
                        <div className="position-relative ">
                          <Form.Control
                            placeholder={t('name')}
                            id={`complement-name-${complement.id}`}
                            className={`mb-2 ${index === 0 ? 'first-complement-focus' : ''}`}
                            {...register(`complements.${index}.name`)}
                            maxLength={50}
                          />
                          <Form.Control.Feedback
                            tooltip
                            type="invalid"
                            style={{ zIndex: 0 }}
                          >
                            {t('invalid_name')}
                          </Form.Control.Feedback>
                        </div>
                        <div className="d-flex justify-content-end">
                          <p
                            className={
                              watch(`complements.${index}.name`).length >= 50 ? 'text-red-500' : ''
                            }
                            data-name-length={complement.id}
                          >
                            {watch(`complements.${index}.name`).length}/50 {t('characters')}
                          </p>
                        </div>
                      </div>
                      <div style={{ marginTop: '2rem' }}>
                        <Button
                          variant="danger"
                          className="mb-auto px-5"
                          onClick={() => handleRemoveComplement(index)}
                        >
                          {t('delete')}
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row className="mb-5 mt-2">
                  <Col sm>
                    <Form.Label>
                      <b>{t('quantity')}</b>
                    </Form.Label>
                    <Row>
                      <Col sm="6" md="6">
                        <InputGroup className="mt-1">
                          <InputGroup.Text>Min.</InputGroup.Text>
                          <Form.Control
                            type="number"
                            {...register(`complements.${index}.min`, {
                              valueAsNumber: true,
                            })}
                          />
                          <Form.Control.Feedback type="invalid">
                            {t('min_greater_max')}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Col>
                      <Col sm="6" md="6">
                        <InputGroup className="mt-1">
                          <InputGroup.Text>Máx.</InputGroup.Text>
                          <Form.Control
                            {...register(`complements.${index}.max`, {
                              valueAsNumber: true,
                            })}
                          />
                          <Form.Control.Feedback type="invalid">
                            {t('max_less_min')}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Col>
                    </Row>
                  </Col>
                  <Col
                    sm="4"
                    md
                    className="d-flex justify-content-end mb-2 mt-auto gap-2"
                  >
                    <Form.Label className='d-flex gap-3'>
                      <Form.Check
                        id={`complemento-obrigatorio-${complement.id}`}
                        {...register(`complements.${index}.required`, {
                          onChange: (e) => {
                            if (watch(`complements.${index}.max`) <= 0) {
                              setValue(`complements.${index}.max`, e.target.checked ? 1 : watch(`complements.${index}.max`))
                            }

                            if (watch(`complements.${index}.min`) <= 0) {
                              setValue(`complements.${index}.min`, e.target.checked ? 1 : watch(`complements.${index}.min`))
                            }
                          }
                        })}
                      />
                      <span>{t('mandatory_addon')}</span>
                    </Form.Label>
                  </Col>
                </Row>
                <hr />
                <Row className="d-none d-md-flex">
                  <Col sm="3" lg="3">
                    {t('name')}
                  </Col>
                  <Col sm="3" lg="3">
                    {t('description')}
                  </Col>
                  <Col sm="3" lg="2">
                    {t('value')}
                  </Col>
                  <Col sm="3" lg="2">
                    {t('stock')}
                  </Col>
                  <Col sm="3" lg="2">
                    {t('options')}
                  </Col>
                </Row>
                <ComplementItems complementIndex={index} />
                <Row className="mt-2">
                  <Col sm="12" md="2" lg="2" className="d-flex">
                    <Button
                      variant="success"
                      className="flex-grow-1"
                      id={`btn-addItemComplement-${index}`}
                      onClick={() => handleAddItemComplement(index, complement)}
                    >
                      + {t('add_item')}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )
        }
        )}
      </Card.Body>
    </Card>
  )
}
