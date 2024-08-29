import { CartsContext } from "@context/cart.ctx";
import { useContext, useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { api } from "src/lib/axios";

interface IfoodModalProps {
  show: boolean
}

export function ModalIfoodNewOrders({ show }: IfoodModalProps) {
  interface Reason {
    cancellationCode: number,
    reason: string
  }
  const { ifoodOrders, setIfoodOrders, newPlacedOrders, setNewPlacedOrders } = useContext(CartsContext)
  const [showReasons, setShowReasons] = useState(false)
  const [reasons, setReasons] = useState<Reason[]>([])
  const [reasonSelected, setReasonSelected] = useState<{ cancellationCode: string, reason: string | undefined }>({ cancellationCode: '0', reason: '' })

  const confirmOrder = async ({ orderId }: { orderId: string }) => {
    try {
      const { data } = await api.post(`/dashboard/ifood/order/${orderId}/updateStatus`, { status: 'CONFIRMED' })

      setNewPlacedOrders((prev) => ({ ...prev, orders: prev.orders.filter((order: any) => order.orderId !== data.order.orderId) }))

    } catch (error) {
      console.error('erro ao confirmar o pedido no ifood', error)
    }
  }

  const cancellationReasons = async (orderId: string) => {
    try {
      const { data } = await api.get(`/dashboard/ifood/order/${orderId}/cancellationReasons`)

      data.forEach((reasons: any) => {
        if (reasons) {
          reasons.cancellationCode = reasons.cancelCodeId
          reasons.reason = reasons.description

          delete reasons.cancelCodeId
          delete reasons.description
        }
      }
      )
      setReasons(data)
      setShowReasons(true)

    } catch (error) {
      console.error('erro ao cancelar o pedido no ifood', error)
    }
  }

  const cancelOrder = async ({ reasons: reasons, orderId }: { reasons: any, orderId: string }) => {
    try {
      if (reasons.reason === undefined) {
        reasons.reason = ''
      }

      const { data } = await api.post(`/dashboard/ifood/order/${orderId}/updateStatus`, { cancellationReason: reasons, status: 'CANCELLED' })

      setShowReasons(false)
      setNewPlacedOrders((prev) => ({ ...prev, orders: prev.orders.filter((order: any) => order.orderId !== data.order.orderId) }))

    } catch (error) {
      console.error('erro ao cancelar o pedido no ifood', error)
    }
  }

  const typeOrderOfCarts = () => {
    let type
    if (newPlacedOrders.orders[0].type === 'D') {
      type = 'Delivery'
    }
    return type
  }

  return (
    <>
      {newPlacedOrders.orders.length &&
        <>
          <Modal show={show} centered backdrop='static' >
            <Modal.Header>
              <h3 className="fw-bold m-0">Pedido IFood</h3>
            </Modal.Header>

            <Modal.Body className="p-0">
              <div className="d-flex flex-column p-3 border boder-bottom gap-2">
                <div>
                  <span className="fw-bold">Cód. Pedido: {newPlacedOrders.orders[0].displayId ? newPlacedOrders.orders[0]?.displayId : newPlacedOrders.orders[0].code}</span>
                </div>
                <div>
                  <span className="fw-bold">Nome: {newPlacedOrders.orders[0].displayId ? newPlacedOrders.orders[0]?.customer.name : newPlacedOrders.orders[0].client.name}</span>
                </div>
                <div>
                  <span className="fw-bold">Total: {newPlacedOrders.orders[0].displayId ? newPlacedOrders.orders[0]?.total.orderAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : newPlacedOrders.orders[0].formsPayment[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div>
                  <span className="fw-bold">Pagamento: {newPlacedOrders.orders[0].displayId ? newPlacedOrders.orders[0]?.payments[0].methods[0].card.brand : newPlacedOrders.orders[0].formsPayment[0].flag}</span>
                </div>
                <div>
                  <span className="fw-bold">Tipo: {newPlacedOrders.orders[0].displayId ? newPlacedOrders.orders[0]?.orderType : typeOrderOfCarts}</span>
                </div>
              </div>
              <div className="d-flex justify-content-between p-3 gap-2">
                <div>
                  <p className="fw-bold">Itens</p>
                  <p className="">{newPlacedOrders.orders[0]?.itens.map((item: any) => {
                    return (
                      <>
                        <div className="d-flex justify-content-between m-0">
                          <p className="col-8 col-sm-6">{item.name}</p>
                          <p className="d-flex justify-content-start col-3 col-sm-3 fw-bold"> <span className="pe-2">-</span> {item.quantity} Sabor</p>
                          <p className="d-flex justify-content-end col-3 col-sm-5">{item.index ? item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : item.details.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        {/* {item.observations && */}
                        <p>OBS.: {item.observations}</p>
                        {/* } */}
                      </>
                    )
                  })}</p>
                </div>
                <div>
                  <p className="fw-bold me-2">Preços</p>
                  <p>{newPlacedOrders.orders[0]?.itens.map((item: any) => {
                    return (
                      <>
                      </>
                    )
                  })}</p>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-center" >
              <Button variant="danger" onClick={() => cancellationReasons(newPlacedOrders.orders[0]?.orderId)}>Recusar Pedido</Button>
              <Button onClick={() => confirmOrder({ orderId: newPlacedOrders.orders[0]?.orderId })}>Aceitar Pedido</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showReasons} centered backdrop='static' onHide={() => setShowReasons(false)} style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <Modal.Header closeButton><h3 className="fw-bold m-0">Recusa de Pedidos iFood</h3></Modal.Header>

            <Modal.Body style={{ height: '15rem' }}>
              <Form.Label>Selecione o Motivo da Recusa do Pedido</Form.Label>
              <Form.Select
                onChange={(e) =>
                  setReasonSelected({ cancellationCode: String(e.target.value), reason: e.target.selectedOptions ? e.target.selectedOptions.item(0)?.id : '' })
                }>
                <option value="">Selecionar...</option>
                {reasons.map((reason) => (
                  <option
                    value={reason.cancellationCode}
                    id={reason.reason}
                    key={reason.cancellationCode}
                  >
                    {reason.reason}
                  </option>
                ))}
              </Form.Select>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="danger" disabled={reasonSelected.cancellationCode === ''} onClick={() => cancelOrder({ reasons: reasonSelected, orderId: newPlacedOrders.orders[0]?.orderId })}>Cancelar Pedido</Button>
            </Modal.Footer>
          </Modal>
        </>
      }
    </>
  )
}
