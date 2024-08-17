import { UserType } from 'next-auth'
import { useSession } from 'next-auth/react'
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { AppContext } from '../../context/app.ctx'
import { Plan, SystemProduct } from '../../types/plan'
import { apiRoute, currency } from '../../utils/wm-functions'

interface PlansProps {
  type: 'create' | 'update'
  setUser?:
  | Dispatch<SetStateAction<Partial<UserType>>>
  | Dispatch<SetStateAction<UserType>>
  user: Partial<UserType>
  plans?: Plan[]
  period?: 'monthly' | 'semester' | 'yearly' | string
  setDefaultPlan?: Dispatch<SetStateAction<Plan>>
  defaultPlan?: Plan
  setOtherPlansValue?: Dispatch<SetStateAction<number>>
  setCart?: Dispatch<
    SetStateAction<
      {
        id: number
        price_id: string
        value: number
        quantity: number
        name: string
        category?: string
        plan_id?: number
        service: string
      }[]
    >
  >
  products: SystemProduct[]
  getPlans?: (plans: Plan[]) => void
}

export function Plans({
  type,
  plans,
  user,
  setOtherPlansValue,
  setCart,
  products,
}: PlansProps) {
  const { data: session } = useSession()

  const { handleShowToast } = useContext(AppContext)
  const [total, setTotal] = useState<number>(0)
  const [principalPlan, setPrincipalPlan] = useState<Plan | undefined>()
  const [userOtherPlans, setUserOtherPlans] = useState<Plan[]>([])
  const [userDeletePlans, setUserDeletePlans] = useState<Plan[]>([])

  const handleChangeSelect = (e: React.FormEvent<HTMLSelectElement>) => {
    const plan = plans?.find(
      (plan) =>
        plan.type === 'register' && plan.id === Number(e.currentTarget.value)
    )

    if (plan) {
      setPrincipalPlan((old) => {
        if (type === 'update' && old && user.plans) {
          if (user.plans.some((plan) => plan.id === old.id)) {
            setUserDeletePlans([...userDeletePlans, old])
          }
          if (
            user.plans.some(
              (userPlan) =>
                userPlan.id === plan.id &&
                userDeletePlans.some((dPlan) => dPlan.id === plan.id)
            )
          ) {
            setUserDeletePlans((oldPlans) =>
              oldPlans.filter((oPlan) => oPlan.id === plan.id)
            )
          }
        }
        return plan
      })

      if (type !== 'update') {
        setUserOtherPlans([])
      }
    }
  }

  const handleChangePlan = (plan: Plan, checked: boolean) => {
    switch (checked) {
      case true:
        const newPlans = userOtherPlans.filter(
          (oPlan) => oPlan.category !== plan.category
        )
        newPlans.push(plan)
        setUserOtherPlans(newPlans)
        if (user.plans) {
          if (user.plans.find((uPlan) => uPlan.id === plan.id)) {
            setUserDeletePlans(
              userDeletePlans.filter((uPlan) => uPlan.id !== plan.id)
            )
          } else {
            const planSameCategory = user.plans.find(
              (oPlan) => oPlan.category === plan.category
            )
            if (planSameCategory) {
              setUserDeletePlans((oldDeletePlans) => {
                oldDeletePlans.push(planSameCategory)
                return oldDeletePlans
              })
            }
          }
        }
        break
      case false:
        if (user.plans && user.plans.find((uPlan) => uPlan.id === plan.id)) {
          setUserDeletePlans([...userDeletePlans, plan])
        }

        setUserOtherPlans((oldPlans) =>
          oldPlans.filter((oPlan) => oPlan.id !== plan.id)
        )
        break
    }
  }

  const handleUpdatePlans = async () => {
    if (!principalPlan) {
      handleShowToast({
        title: 'Planos',
        content: 'É necessário ter o plano principal selecionado',
      })
      return
    }

    const newPlans = [principalPlan, ...userOtherPlans]

    if (user.plans) {
      if (
        user.plans.every((plan) => newPlans.includes(plan.id)) &&
        newPlans.length === user.plans.length
      ) {
        handleShowToast({
          title: 'Planos',
          content: 'Não houve alterações nos planos',
        })

        return
      }
    }

    const dataPerPlan = newPlans.map((plan) => {
      const { price_id, product_id, planValue } = getPlanProperty(
        plan,
        user.controls?.currency,
        user.controls?.period
      )
      return {
        price_id,
        product_id,
        planId: plan.id,
        value: parseInt(String(planValue * 100)),
      }
    })

    const dataDeletePlan = userDeletePlans.map((plan) => {
      const { price_id, product_id, planValue } = getPlanProperty(
        plan,
        user.controls?.currency,
        user.controls?.period
      )
      return {
        price_id,
        product_id,
        planId: plan.id,
        value: parseInt(String(planValue * 100)),
      }
    })

    const body = {
      userId: user.id,
      plansItems: dataPerPlan,
      deletedPlans: dataDeletePlan,
    }

    try {
      const { data: newPlans } = await apiRoute(
        '/dashboard/userPlans',
        session,
        'PATCH',
        body
      )
      if (newPlans) {
        user.plans = newPlans
      }
      setUserDeletePlans([])

      handleShowToast({ type: 'success', title: 'Planos' })
    } catch (error) {
      console.error(error)
      handleShowToast({ type: 'erro' })
    }
  }

  const getPeriod = () => {
    if (user.controls?.period) {
      switch (user.controls?.period) {
        case 'monthly':
          return 'Mensal'
        case 'semester':
          return 'Semestral'
        case 'yearly':
          return 'Anual'
      }
    }

    return 'Mensal'
  }

  const cancelUserModifiedPlan = () => {
    avaliablePlans(true)
    setUserDeletePlans([])
  }

  const getPlanProperty = useCallback(
    (
      plan: Plan,
      currency: string = 'brl',
      period: 'monthly' | 'semester' | 'yearly' = 'monthly'
    ) => {
      const product = products.find(
        (prod) => prod.plan_id === plan.id && prod.operations.type === period
      )
      const price = product?.operations.prices.find(
        (price) => price.id === product.default_price
      )
      const price_id = price?.id

      if (product && price && price.currencies) {
        const currency =
          price.currencies[user?.controls?.currency ?? price.default_currency]

        const valuePrice = currency?.unit_amount
        const planValue = valuePrice ? valuePrice / 100 : plan[period]

        return {
          price_id,
          planValue,
          product_id: product.id,
        }
      }

      return {
        planValue: plan[period],
      }
    },
    [products, user?.controls?.currency]
  )

  const $plans = (type: 'register' | 'upgrade') => {
    if (principalPlan?.relateds?.length || plans?.length) {
      return (type === 'register' ? plans : principalPlan?.relateds)
        ?.filter((plan) => plan.category !== principalPlan?.category)
        .map((plan) => {
          if (plan.type === type) {
            if (!plan.status) {
              const userHavePlan = user.plans?.find(
                (p: any) => p.id === plan.id
              )

              if (!userHavePlan) {
                return null
              }
            }

            const { price_id, planValue } = getPlanProperty(
              plan,
              user.controls?.currency,
              user.controls?.period as any
            )

            return (
              <Form.Check
                key={plan.id}
                id={plan.id.toString()}
                className="plansCheck"
                disabled={!price_id}
                title={!price_id ? 'Plano com problemas de preço.' : undefined}
                checked={userOtherPlans.some((oPlan) => oPlan.id === plan.id)}
                data-value={planValue}
                data-category={`${type}-${plan.category}`}
                label={`${plan.name} - ${currency({
                  value: Number(planValue),
                  currency: user.controls?.currency,
                  language: user.controls?.language,
                })} ${!plan.status ? '(Plano Antigo)' : userDeletePlans.some((dPlan) => dPlan.id === plan.id) ? `(Será removido)` : ''}`}
                onChange={(e) => {
                  handleChangePlan(plan, e.target.checked)
                }}
              />
            )
          }
        })
        .filter((htmlPlan) => htmlPlan)
    } else {
      if (type === 'register') {
        return (
          <span className="fs-7">
            Este plano não pode ser adicionado com outros planos.
          </span>
        )
      } else {
        return (
          <span className="fs-7">
            Nenhum plano com desconto para o plano escolhido
          </span>
        )
      }
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (userOtherPlans && principalPlan) {
      const plansToCalcValue = [principalPlan, ...userOtherPlans]
      const total = plansToCalcValue.reduce((acc, plan) => {
        const { price_id, planValue } = getPlanProperty(
          plan,
          user.controls?.currency,
          user.controls?.period
        )

        if (price_id) {
          return acc + planValue
        }
        return acc
      }, 0)

      setTotal(total)
      setOtherPlansValue && setOtherPlansValue(total)
    }
  })

  const avaliablePlans = useCallback(
    (reavaliable?: boolean) => {
      if (type === 'create' && plans) {
        const plan = plans.find((plan) => plan.id === 11)
        setPrincipalPlan(plan)
      }

      if (
        (type === 'update' && user.plans && !userOtherPlans.length) ||
        (reavaliable && user.plans)
      ) {
        const newPrincipalPlan = user.plans.find(
          (plan) => plan.type === 'register'
        )

        if (newPrincipalPlan) {
          const otherPlans = user.plans.filter(
            (plan) => plan.id !== newPrincipalPlan.id
          )

          setPrincipalPlan(newPrincipalPlan)
          setUserOtherPlans(otherPlans)
        }
      }
    },
    [type, plans, user.plans, userOtherPlans.length]
  )

  useEffect(() => {
    setCart &&
      setCart((old) => {
        const newCart = old.filter((item) => item.service !== 'plan')

        if (principalPlan) {
          const plansToCalcValue = [principalPlan, ...userOtherPlans]
          const plansItems = plansToCalcValue
            .map((plan) => {
              const { price_id, planValue, product_id } = getPlanProperty(
                plan,
                user.controls?.currency,
                user.controls?.period
              )
              return {
                id: product_id || plan.id,
                plan_id: plan.id,
                price_id: price_id as string,
                name: plan.name,
                category: plan.category,
                value: planValue,
                service: 'plan',
                quantity: 1,
              }
            })
            .sort((planA, planB) => {
              if (planA.name < planB.name) {
                return -1
              } else {
                return 1
              }
            })

          newCart.push(...plansItems)
        }

        return newCart
      })
  }, [
    user.controls,
    principalPlan,
    userOtherPlans,
    setCart,
    getPlanProperty,
    plans,
  ])

  useEffect(() => {
    avaliablePlans()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  return (
    <>
      <hr className="mb-4" />
      <Card>
        <Card.Body className="wm-default text-dark text-start">
          <Form>
            <Row className="mb-3">
              <Col className="d-flex align-items-center justify-content-between">
                <h5 className="fw-bold m-0">Plano Principal</h5>
                <div className="d-flex justify-content-end gap-2">
                  {type === 'update' && (
                    <>
                      {userDeletePlans.length ? (
                        <Button
                          size="sm"
                          className="px-4"
                          onClick={cancelUserModifiedPlan}
                        >
                          Cancelar Mudanças
                        </Button>
                      ) : null}
                      <Button
                        variant="success"
                        size="sm"
                        className="px-4"
                        onClick={handleUpdatePlans}
                      >
                        Salvar
                      </Button>
                    </>
                  )}
                </div>
              </Col>
            </Row>
            <Form.Select
              value={principalPlan?.id}
              // disabled={type === "update"}
              onChange={(e) => handleChangeSelect(e)}
            >
              {plans
                ?.filter((plan: Plan) => {
                  // if (type === "update") {
                  //   if ((user.plans?.some(uPlan => uPlan.category === plan.category) ||
                  //     userOtherPlans.some(uPlan => uPlan.category === plan.category)) && principalPlan?.id !== plan.id) {
                  //     return false
                  //   }
                  // }

                  if (plan.type === 'register' && !plan.status) {
                    return user.plans?.some((uPlan) => uPlan.id === plan.id)
                  }

                  return plan.type === 'register' && plan.status
                })
                .map((plan: Plan) => {
                  const { price_id, planValue } = getPlanProperty(
                    plan,
                    user.controls?.currency,
                    user.controls?.period as any
                  )
                  if (price_id) {
                    return (
                      <option
                        key={plan.id}
                        data-period-value={planValue}
                        value={plan.id}
                      >
                        {plan.name} -{' '}
                        {currency({
                          currency: user.controls?.currency,
                          language: user.controls?.language,
                          value: Number(planValue),
                        })}
                      </option>
                    )
                  }
                })}
            </Form.Select>
            {/* <Row className="mt-3">
              <Col sm={12}>
                <h5 className="fw-bold">Planos Adicionais</h5>
              </Col>
              <Col className="ps-4">{$plans('register')}</Col>
            </Row> */}
            <hr />
            <Row className="mt-3">
              <Col sm={12}>
                <h5 className="fw-bold">Planos Adicionais</h5>
              </Col>
              <Col className="ps-4">{$plans('upgrade')}</Col>
            </Row>
          </Form>
          <>
            <br />
            <div className="d-flex gap-md-4 fw-bold flex-column flex-md-row gap-0">
              <span>
                Total:{' '}
                {currency({
                  currency: user.controls?.currency,
                  language: user.controls?.language,
                  value: total,
                })}
              </span>
              <span>Tipo de Período: {getPeriod()}</span>
            </div>
          </>
        </Card.Body>
      </Card>
    </>
  )
}
