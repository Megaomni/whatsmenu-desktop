import { useCallback, useContext, useEffect, useState } from 'react'
import { Button, Col, Form, Modal, OverlayTrigger, Popover, Row, Table } from 'react-bootstrap'
import { BsArrowRight } from 'react-icons/bs'
import { RiArrowDownSFill } from 'react-icons/ri'
import { apiRoute } from '../../../../utils/wm-functions'
import { ProfileFee } from '../../../../types/profile'
import { ICommandsFees, TableContext } from '../../../../context/table.ctx'
import { useSession } from 'next-auth/react'
import { AppContext } from '../../../../context/app.ctx'
import TableCTX, { TableOpened } from '../../../../types/table'
import { useTranslation } from 'react-i18next'

interface FeesProps {
  show: boolean
  handleClose: () => void
  handleConfirm: (table?: TableCTX) => void
  typeModal: 'command' | 'table'
}

export function Fees(props: FeesProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { handleShowToast, user, currency } = useContext(AppContext)
  const { command, setCurrentCommandId, table, haveFees, updateTable } = useContext(TableContext)
  const { show, handleClose, handleConfirm, typeModal } = props
  let [fees, setFees] = useState<ProfileFee[]>([])

  const handleShortcutActions = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        handleConfirm()
      }
    },
    [handleConfirm]
  )

  const handleSaveFees = async () => {
    if (typeModal === 'command' && command?.fees.length) {
      try {
        await apiRoute('/dashboard/command/updateFees', session, 'PATCH', { commandId: command?.id, fees: command?.fees })
      } catch (error) {
        handleShowToast({ type: 'erro', title: t('order_slip_fees') })
        return console.error(error)
      }
    }
    if (typeModal === 'table' && table) {
      const commandsFees: ICommandsFees[] = table.activeCommands().reduce((commandFees: ICommandsFees[], activeCommand) => {
        activeCommand.fees.forEach((fee) => {
          if (fee.code) {
            if (fee.type === 'fixed') {
              commandFees.push({
                id: activeCommand.id,
                feeAutomatic: fee.automatic,
                feeCode: fee.code,
                feeQuantity: fee.quantity,
              })
            } else {
              commandFees.push({
                id: activeCommand.id,
                feeAutomatic: fee.automatic,
                feeCode: fee.code,
              })
            }
          }
        })
        return commandFees ?? []
      }, [])

      if (commandsFees.length) {
        try {
          const { data } = await apiRoute('/dashboard/command/updateTableFees', session, 'PATCH', { commands: commandsFees })
          if (haveFees) {
            handleShowToast({
              type: 'success',
              title: `${t('fees')} ${typeModal === 'table' ? t('table') : t('order_slip')}`,
              position: 'top-center',
            })
          }
          table.opened = new TableOpened({ ...table.opened, ...data })
          updateTable(table)
        } catch (error) {
          handleShowToast({ type: 'erro', title: t('order_slip_fees') })
          return console.error(error)
        }
      }
    }
    handleConfirm()
  }

  useEffect(() => {
    if (show) {
      window.onkeyup = handleShortcutActions
    }
    return () => {
      window.onkeyup = () => {}
    }
  }, [show, handleShortcutActions])

  useEffect(() => {
    setTimeout(() => {
      if (typeModal === 'command' && command) {
        setFees(command.fees)
      }
      if (typeModal === 'table' && table) {
        const tableFees = table.opened?.getUpdatedFees(true, true).map((fee) => {
          if (fee.id) {
            fee.automatic = !!table.opened?.allFeesById(fee.id).some((f) => f.automatic)
          }
          return fee
        })
        setFees(tableFees as ProfileFee[])
      }
    }, 10)
  }, [command, table, typeModal])

  return (
    <Modal
      show={show}
      onEnter={() => {
        !haveFees && handleConfirm()
      }}
      className={`${haveFees ? 'visible' : 'invisible'}`}
      onHide={() => {
        handleClose()
      }}
      centered
      backdrop="static"
    >
      <Modal.Header>
        <h3>
          <b>{t('fees')}</b>
        </h3>
      </Modal.Header>
      <Modal.Body>
        <h4>
          <b>
            {typeModal === 'command' ? t('order_slip') : t('table')}:{' '}
            <span className="text-red-500">{typeModal === 'command' ? command?.name : table?.name}</span>
          </b>
        </h4>
        <Table className=" mt-3" responsive striped bordered hover>
          <thead>
            <tr className="text-center align-baseline">
              <th>{t('fees')}</th>
              <th>{t('quantity')}</th>
              <th>{t('value')}</th>
              <th>{t('charge')}</th>
            </tr>
          </thead>
          <tbody>
            {fees?.map((fee) => {
              return (
                <tr key={fee.code} className="text-center align-baseline">
                  <td>{fee.code}</td>
                  <td className="text-center">
                    {typeModal === 'table' ? (
                      fee.type === 'fixed' ? (
                        <div>
                          <OverlayTrigger
                            rootClose
                            trigger="click"
                            placement="auto"
                            overlay={
                              <Popover id="popover-basic">
                                <Popover.Header as="h3">{t('order_slips')}</Popover.Header>
                                <Popover.Body
                                  style={{
                                    maxHeight: '15rem',
                                    overflowY: 'scroll',
                                  }}
                                  className="py-2"
                                >
                                  {table?.activeCommands()?.map((command, index) => {
                                    const commandFee: ProfileFee | undefined = command.fees.find((f) => f.id === fee.id)
                                    return (
                                      commandFee && (
                                        <Row key={command.id}>
                                          <Col sm className="d-flex">
                                            <span className="m-auto" style={{ whiteSpace: 'break-spaces', wordBreak: 'break-all' }}>
                                              {command.name}
                                            </span>
                                          </Col>
                                          <Col sm className="d-flex">
                                            <Form.Control
                                              value={!commandFee.automatic ? 0 : commandFee.quantity}
                                              disabled={!commandFee.automatic}
                                              type="number"
                                              min={0}
                                              className={`fee-${fee.code} m-auto`}
                                              id={`${command.id}`}
                                              onChange={(e) => {
                                                commandFee.quantity = Number(e.target.value)
                                                setCurrentCommandId(command.id)
                                              }}
                                            />
                                          </Col>
                                          <Col sm className="d-flex">
                                            <Form.Check
                                              data-id={command.id}
                                              checked={commandFee.automatic}
                                              onChange={(e) => {
                                                commandFee.automatic = e.target.checked
                                                if (!e.target.checked) {
                                                  commandFee.oldQuantity = commandFee.quantity
                                                  commandFee.quantity = 0
                                                } else {
                                                  commandFee.quantity = commandFee.oldQuantity
                                                }
                                                setCurrentCommandId(command.id)
                                              }}
                                              className={`fee-check-${fee.code} m-auto`}
                                            />
                                          </Col>
                                          {index + 1 !== table?.activeCommands()?.length && <hr className="my-2" />}
                                        </Row>
                                      )
                                    )
                                  })}
                                </Popover.Body>
                              </Popover>
                            }
                          >
                            <Button variant="" className="p-0 m-auto" style={{ outline: 'none' }}>
                              {table
                                ?.activeCommands()
                                ?.flatMap((command) => command.fees)
                                .reduce((totalQuantity, feeReduce) => {
                                  if (feeReduce.status && feeReduce.automatic && feeReduce.quantity && feeReduce.code === fee.code) {
                                    totalQuantity += feeReduce.quantity
                                  }
                                  return totalQuantity
                                }, 0)}
                              <RiArrowDownSFill size={15} />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      ) : (
                        '-'
                      )
                    ) : (
                      <div className="d-flex text-center">
                        {fee.type === 'fixed' ? (
                          <Form.Control
                            type="number"
                            className="w-75 mx-auto"
                            data-quantity-code={`feeQuantity-${fee.code}`}
                            value={fee.quantity?.toString()}
                            onChange={(e) => {
                              e.target.value = Number(e.target.value) < 0 ? '0' : e.target.value
                              const haveFee = fees.find((f) => f.code === fee.code)
                              if (haveFee) {
                                haveFee.quantity = Number(e.target.value)
                              }
                              setFees([...fees])
                            }}
                          />
                        ) : (
                          <span className="mx-auto">-</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    {fee.type === 'percent'
                      ? `${fee.value}%`
                      : currency({
                          value:
                            typeModal === 'command'
                              ? fee.automatic && fee.status
                                ? (fee.quantity as number) * fee.value
                                : 0
                              : table
                                  ?.activeCommands()
                                  ?.flatMap((command) => command.fees)
                                  .reduce((totalQuantity, feeReduce) => {
                                    if (feeReduce.code === fee.code) {
                                      if (feeReduce.quantity && feeReduce.status && feeReduce.automatic) {
                                        totalQuantity += feeReduce.value * feeReduce.quantity
                                      }
                                    }
                                    return totalQuantity
                                  }, 0) ?? 0,
                        })}
                  </td>
                  <td>
                    <Form.Check
                      checked={
                        typeModal === 'table'
                          ? table?.activeCommands().some((c) => c.fees.find((f) => f.code === fee.code)?.automatic)
                          : fee.automatic
                      }
                      id="checkAutomatic"
                      onChange={(e) => {
                        if (typeModal === 'table' && table) {
                          table?.activeCommands().forEach((activeCommand) => {
                            const haveFee = activeCommand.fees.find((f) => f.code === fee.code)
                            if (haveFee) {
                              haveFee.automatic = e.target.checked
                              if (haveFee.automatic) {
                                haveFee.quantity = 1
                              }
                            }
                          })
                        }
                        fee.automatic = e.target.checked
                        setFees([...fees])
                      }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-start">
        <div className="fs-8 fw-bold m-0">
          <p className="m-0">{t('shortcuts')}</p>
          <p className="m-0">Enter: `${t('next_confirm')}`</p>
          <p className="m-0">Esc: `${t('back_cancel')}`</p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              handleClose()
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="success"
            className="px-4"
            onClick={() => {
              handleSaveFees()
            }}
          >
            <BsArrowRight />
            {t('proceed')}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
