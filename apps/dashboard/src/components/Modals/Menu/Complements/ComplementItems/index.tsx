import { AppContext } from "@context/app.ctx"
import { currency, mask } from "@utils/wm-functions"
import { useContext } from "react"
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap"
import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ComplementFormData } from ".."

interface ComplementItemsProps {
  complementIndex: number
}

export const ComplementItems = ({ complementIndex }: ComplementItemsProps) => {
  const { profile } = useContext(AppContext)
  const { t } = useTranslation()
  const { register, control, watch, setValue } = useFormContext<{ complements: ComplementFormData[] }>()
  const { append: appendItem, remove: removeItem, fields: items } = useFieldArray({
    control,
    name: `complements.${complementIndex}.itens`,
  })

  return (
    <>
      {
        watch(`complements.${complementIndex}.itens`).map((item, itemIndex) => (
          <div key={itemIndex}>
            <br />
            <Row>
              <Col sm="3" lg="3">
                <div className="position-relative">
                  <Form.Control
                    className={item.code}
                    id={`complement-item-${item.code}`}
                    placeholder={t('complements')}
                    {...register(`complements.${complementIndex}.itens.${itemIndex}.name`)}
                    maxLength={70}
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
                    id={`itemComplement-${item.code}`}
                    className={
                      watch(`complements.${complementIndex}.itens.${itemIndex}.name`).length >= 70 ? 'text-red-500' : ''
                    }
                  >
                    {watch(`complements.${complementIndex}.itens.${itemIndex}.name`).length}/70 {t('characters')}
                  </p>
                </div>
              </Col>
              <Col sm="3" lg="3">
                <Form.Control
                  placeholder={t('description')}
                  {...register(`complements.${complementIndex}.itens.${itemIndex}.description`)}
                />
                <div className="d-flex justify-content-end">
                  <p
                    id={`itemDescription-${item.code}`}
                    className={
                      (watch(`complements.${complementIndex}.itens.${itemIndex}.description`)?.length || 0) >= 100 ? 'text-red-500' : ''
                    }
                  >
                    {watch(`complements.${complementIndex}.itens.${itemIndex}.description`)?.length}/100 {t('characters')}
                  </p>
                </div>
              </Col>
              <Col sm="3" lg="2">
                <InputGroup className="mb-2">
                  <InputGroup.Text>
                    {currency({ value: 0, symbol: true })}
                  </InputGroup.Text>
                  <Form.Control
                    required
                    min="0"
                    {...register(`complements.${complementIndex}.itens.${itemIndex}.value`, {
                      valueAsNumber: true,
                      onChange: (e) => mask(e, 'currency'),
                    })}
                  />
                </InputGroup>
              </Col>
              {profile.options.inventoryControl ? (
                !watch(`complements.${complementIndex}.itens.${itemIndex}.bypass_amount`) ? (
                  <Col sm="3" lg="2">
                    <InputGroup className="position-relative mb-2">
                      <Button
                        style={{ minWidth: '48.79px' }}
                        onClick={() => {
                          setValue(`complements.${complementIndex}.itens.${itemIndex}.amount`, Number(watch(`complements.${complementIndex}.itens.${itemIndex}.amount`)) <= 0 ? 0 : Number(watch(`complements.${complementIndex}.itens.${itemIndex}.amount`)) - 1)
                        }}
                      >
                        -
                      </Button>

                      <Form.Control
                        {...register(`complements.${complementIndex}.itens.${itemIndex}.amount`, {
                          valueAsNumber: true,
                        })}
                      />

                      <Button
                        className="rounded-end"
                        style={{ minWidth: '48.79px' }}
                        onClick={() => {
                          setValue(`complements.${complementIndex}.itens.${itemIndex}.amount`, Number(watch(`complements.${complementIndex}.itens.${itemIndex}.amount`)) + 1)
                        }}
                      >
                        +
                      </Button>
                      <Form.Control.Feedback tooltip type="invalid">
                        {t('please_enter_valid_value')}!
                      </Form.Control.Feedback>
                      <div className="d-flex w-100 justify-content-end">
                        <Form.Check
                          id={`bypass-${item.code}`}
                          label={t('always_available')}
                          onClick={() => {
                            setValue(`complements.${complementIndex}.itens.${itemIndex}.bypass_amount`, true)
                            setValue(`complements.${complementIndex}.itens.${itemIndex}.amount`, 0)
                          }}
                        />
                      </div>
                    </InputGroup>
                  </Col>
                ) : (
                  <Col sm="3" lg="2">
                    <Button
                      className="rounded-end w-100 my-sm-0 my-2"
                      style={{ minWidth: '48.79px' }}
                      onClick={() => {
                        setValue(`complements.${complementIndex}.itens.${itemIndex}.bypass_amount`, false)
                        setValue(`complements.${complementIndex}.itens.${itemIndex}.amount`, 1)
                      }}
                    >
                      {t('enable_stock')}
                    </Button>
                  </Col>
                )
              ) : null}
              <Col sm="12" lg className="mb-auto">
                <Row className="justify-content-end gap-2">
                  <Col sm md lg className="d-flex">
                    <Button
                      className={`${!watch(`complements.${complementIndex}.itens.${itemIndex}.status`) ? 'complement-item-button' : ''} `}
                      variant={`${!watch(`complements.${complementIndex}.itens.${itemIndex}.status`) ? 'outline-orange text-orange' : 'orange text-white'} `}
                      style={{ flex: '1 1 150px' }}
                      tabIndex={-1}
                      onClick={() => {
                        setValue(`complements.${complementIndex}.itens.${itemIndex}.status`, !watch(`complements.${complementIndex}.itens.${itemIndex}.status`))
                      }}
                    >
                      {watch(`complements.${complementIndex}.itens.${itemIndex}.status`) ? t('pause') : t('paused')}
                    </Button>
                  </Col>
                  <Col sm md lg className="d-flex">
                    <Button
                      variant="danger"
                      style={{ flex: '1 1 150px' }}
                      tabIndex={-1}
                      onClick={() => {
                        removeItem(complementIndex)
                      }}

                    >
                      {t('delete')}
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        ))
      }
    </>
  )
}