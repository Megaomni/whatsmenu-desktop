import { useSession } from 'next-auth/react'
import { useContext, useEffect, useRef, useState } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { IReactToPrintProps, useReactToPrint } from 'react-to-print'
import { AppContext } from '../../../context/app.ctx'
import { CartsContext } from '../../../context/cart.ctx'
import { TableContext } from '../../../context/table.ctx'
import useWebPrint from '../../../hooks/useWebPrint'
import { setCartsAction } from '../../../reducers/carts/actions'
import Cart from '../../../types/cart'
import { SendStatusMessageForm } from '../../SendStatusMessageForm'
import { PackageAlterDate } from '../Requests/Package/AlterDate'
import { TablePrinter } from './TablePrint'
import { TextOnly } from './TextOnly'
import { Print } from '../../../context/components/Print'
import { NotePrint } from './NotePrint'
import { apiRoute } from '@utils/wm-functions'
import { useTranslation } from 'react-i18next'

export function PrinterRequests() {
  const { t } = useTranslation()
  const { possibleMobile } = useContext(AppContext)
  const {
    carts,
    showLostRequestsModal,
    setShowLostRequestsModal,
    motoboys,
    setCart,
    updateMotoboyId,
    cartEvents,
  } = useContext(CartsContext)
  const { data: session } = useSession()
  const [cartsNotPrinted, setCartsNotPrinted] = useState<Cart[]>([])

  const {
    setRequestsToPrint,
    handleShowToast,
    profile,
    handleConfirmModal,
    audio,
    wsPrint,
    requestsToPrint,
    setPrintStart,
    door,
    setDoor,
  } = useContext(AppContext)
  const { tablesFetched, tables, updateTableBeforeClose } =
    useContext(TableContext)
  const {
    carts: cartsToPrint,
    profileOptions,
    type,
    onHide,
    report,
    titleTable,
    printerTest,
    printerCenter,
    wsPrinting,
    onFinished,
    table,
  } = requestsToPrint
  const waitMillis = localStorage.getItem('waitMillis')
    ? Number(localStorage.getItem('waitMillis'))
    : 5000

  const [showAlterDateModal, setShowAlterDateModal] = useState<boolean>(false)
  const [printQueueActive, setPrintQueueActive] = useState(false)
  const [alreadyPrintedLostRequests, setAlreadyPrintedLostRequests] =
    useState(false)
  const [detaildTable, setDetaildTable] = useState(false)

  // const componentRef = useRef<HTMLTableElement>(null);
  const componentRef = useRef<HTMLPreElement>(null)

  const clearAppRequests = () => {
    setRequestsToPrint({ carts: [] })
  }

  const copies = report ? 1 : (profileOptions ?? profile.options)?.print.copies
  const copiesTimes = Array(copies > 100 || copies < 0 ? 1 : copies).fill('.')
  const CompTablePrint: any = (profileOptions ?? profile.options)?.print
    .textOnly
    ? TextOnly
    : TablePrinter

  const { printBluetooth, printUsb } = useWebPrint()

  const handleClose = () => {
    onHide && onHide(carts[0])
    setCart(carts[0])
    setRequestsToPrint({
      carts: [],
      show: false,
      command: null,
    })
  }

  // const handleMotoboyChange = async (cart: Cart, e: ChangeEvent<HTMLSelectElement>) => {
  //   try {
  //     await apiRoute(`/dashboard/motoboys/${cart.id}?motoboyId=${e.target.value}`, session, 'PATCH')
  //   } catch (error) {
  //     console.log(error)
  //     throw error
  //   }
  // }

  // const showAssignedMotoboy = async (cart: Cart) => {
  //   try {
  //     return await apiRoute(`/dashboard/motoboys/${cart.id}`, session, 'GET')
  //   } catch (error) {
  //     console.log(error)
  //     throw error
  //   }
  // }

  let timeout: NodeJS.Timeout
  const printConfig: IReactToPrintProps = {
    content: () => componentRef.current,
    onBeforeGetContent: () => {
      console.log((profileOptions ?? profile.options)?.print.width)
      if (componentRef.current) {
        console.log(componentRef.current?.innerText)
      }
    },
    onPrintError: (_, err) => {
      setPrintStart(false)
      setDoor((door) => true)
      console.error(`${t('printing_error')}.`, err)
    },
    documentTitle: profile.name,
    copyStyles: false,
    pageStyle: `
    * {
      padding: 0;
      margin: 0;
    }
    *.text-only,
    *.title {
      display: inherit !important;
      white-space: normal !important;
    }

    *.formated {
      white-space: pre-line !important;
      font-size: ${(profileOptions ?? profile.options)?.print.fontSize === 7 ? '14pt' : '18pt'};
    }
    
    .formated.print-title {
      font-size: 1.75rem !important;
      font-weight: bolder;
      text-align: center;
    }
  
    .formated.print-row div {
      display: flex;
      width: ${(profileOptions ?? profile.options)?.print.width === '302px' ? 100 : 65}mm !important;
      overflow: hidden;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .formated.print-row div p {
      &.complement-space {
        padding-left: ${(profileOptions ?? profile.options)?.print.width === '302px' ? 13 : 4}mm !important;
      }

      &.item-space {
        padding-left: ${(profileOptions ?? profile.options)?.print.width === '302px' ? 20 : 8}mm !important;
      }

      &.transshipment-space {
        padding-left: ${(profileOptions ?? profile.options)?.print.width === '302px' ? 9 : 5}mm !important;
      }
    }
      `,
    onBeforePrint() {
      timeout = setTimeout(() => {
        setDoor((old) => true)
        setRequestsToPrint((old) => {
          const cart = old.carts[0]
          if (cart && carts && session) {
            if (cart.id === cartsToPrint[0].id) {
              cart.setPrinted(session)
              cart.print = 1
            }
          }
          sessionStorage.removeItem('printedQueue')

          return old
        })
      }, 5000)
    },
    onAfterPrint() {
      const copies = possibleMobile
        ? report
          ? 1
          : (profileOptions ?? profile.options)?.print.copies
        : Number(sessionStorage.getItem(`${cartsToPrint[0].id}_copies`) ?? 1)

      if (
        copies ===
        (report ? 1 : (profileOptions ?? profile.options)?.print.copies)
      ) {
        onFinished && onFinished()
      }

      if (
        copies <
          (report ? 1 : (profileOptions ?? profile.options)?.print.copies) &&
        cartsToPrint[0]
      ) {
        sessionStorage.setItem(`${cartsToPrint[0].id}_copies`, `${copies + 1}`)
        if (audio && wsPrinting) {
          audio.onended = () => {
            handlePrint()
          }
          audio?.load()
          audio.play().catch(() => {
            console.error(`${'could_not_send_printing'}`)
            handlePrint()
          })
        } else {
          handlePrint()
        }
      } else {
        sessionStorage.removeItem(`${cartsToPrint[0].id}_copies`)
        try {
          if (cartsToPrint[0] && session) {
            const confirmPrint = async () => {
              cartsToPrint[0].print = 1
              await cartsToPrint[0].setPrinted(session)
            }
            confirmPrint()
            if (wsPrinting) {
              setCartsNotPrinted((state) => {
                const newArray = state.filter((cart, index) => index !== 0)
                return [...newArray]
              })
            }
          }

          setTimeout(() => {
            if (audio) {
              audio.onended = null
            }
            if (!possibleMobile) {
              clearTimeout(timeout)
              setDoor(true)
            }
          }, 20)
        } catch (error) {
          console.error(error)

          cartsToPrint[0].print = 0
          setPrintStart(false)
          setDoor(true)

          handleShowToast({
            type: 'erro',
            title: t('order_confirmation'),
            content: t('could_not_print_order'),
          })
        } finally {
          setRequestsToPrint({ carts: [] })
          sessionStorage.removeItem(`printedQueue`)
        }
      }
    },
  }

  if (
    (profileOptions ?? profile.options)?.print?.web &&
    (profileOptions ?? profile.options)?.print?.web !== ''
  ) {
    // let dataToPrint = componentRef.current?.innerText
    printConfig.print = async () => {
      if (componentRef.current?.innerText) {
        ;(profileOptions ?? profile.options)?.print?.web === 'bluetooth'
          ? await printBluetooth(componentRef.current.innerText)
          : await printUsb(componentRef.current.innerText)
      }
    }
  }

  if ('isElectron' in window) {
    printConfig.print = async (target) => {
      delete cartsToPrint[0].command?.opened?.table?.opened
      if ('WhatsMenuPrintApi' in window) {
        ;(window.WhatsMenuPrintApi as any).print(
          JSON.stringify({
            cart: {
              ...cartsToPrint[0],
              motoboy: motoboys.find(
                (motoboy) => motoboy.id === cartsToPrint[0].motoboyId
              ),
            },
            profile: { ...profile, ...profileOptions },
            table,
            printType:
              type === 'command' || type === 'table' ? type : undefined,
          })
        )
      }
    }
  }

  const handlePrint = useReactToPrint(printConfig)

  const $alterDateModal = (cart: Cart) => {
    return (
      <PackageAlterDate
        show={showAlterDateModal}
        cart={cart}
        onHide={() => {
          setShowAlterDateModal(false)
        }}
      />
    )
  }

  const $btnAlterDate = (
    <Button
      variant="outline-dark"
      className=" fs-7 w-100 mt-1"
      disabled={cartsToPrint[0]?.status === 'canceled'}
      onClick={() => {
        // requestsToPrint.onHide();
        setShowAlterDateModal(true)
      }}
    >
      {/* <CgArrowsExchangeAlt size={20} /> */}
      <span className="align-middle">{t('change_date')}</span>
    </Button>
  )

  const pushToPrint = async () => {
    if ((profileOptions ?? profile.options)?.print.app && wsPrint?.wsEmit) {
      wsPrint.wsEmit('directPrint', {
        58: componentRef.current?.innerText.replaceAll('\u00A0', ' '),
        80: componentRef.current?.innerText.replaceAll('\u00A0', ' '),
        requestId: cartsToPrint[0].id,
      })
      // handlePrintApp(
      //   clearAppRequests,
      //   wsPrint,
      //   requests,
      //   type,
      //   report,
      //   {
      //     table: requestsToPrint.table,
      //     opened: requestsToPrint.opened,
      //     command: requestsToPrint.command,
      //   }
      // )
      setDoor((door) => true)
      if (!cartsToPrint[0].print && session) {
        await cartsToPrint[0].setPrinted(session)
        cartsToPrint[0].print = 1
        setCartsAction(carts)
      }
    } else {
      handlePrint()
    }
  }

  // //Verificação se o modal esta aberto e fecha para o pedido que chegou ser impresso
  useEffect(() => {
    if (
      !profile.options?.print.app &&
      door &&
      requestsToPrint.show &&
      cartsNotPrinted.length &&
      !wsPrinting
    ) {
      setRequestsToPrint({ carts: [] })
    }
  }, [
    door,
    cartsNotPrinted,
    requestsToPrint,
    carts,
    setRequestsToPrint,
    wsPrinting,
  ])

  useEffect(() => {
    const cartsWithPrintZero = carts
      .filter((cart) => !cart.print)
      .sort((cartA, cartB) => Number(cartA.code) - Number(cartB.code))
    setCartsNotPrinted(cartsWithPrintZero)
  }, [carts, setCartsNotPrinted])

  //Filtro de requests que não foram impressos
  // useEffect(() => {
  //   if (door && !profile?.options?.print?.app) {
  //     console.log("Procurando por pedidos não impressos.");
  //     setCartsNotPrinted(state => {
  //       if (!state.length) {
  //         state.sort((cartA, cartB) => Number(cartA.code) - Number(cartB.code));
  //         const toPrint = state;
  //         carts.forEach(cart => {
  //           const exists = toPrint.find(r => r.id === cart.id);
  //           if (!exists && !cart.print && cart.status !== 'canceled') {
  //             !possibleMobile && (cart.print = 1);
  //             toPrint.push(cart);
  //           }
  //         });
  //         toPrint.sort((cartA, cartB) => Number(cartA.code) - Number(cartB.code));

  //         if (state.length) {
  //           setRequestsToPrint({ carts: [] });
  //           return compareItems(toPrint, carts) ? [...state] : [...toPrint];
  //         }

  //         return state;
  //       }

  //       return state
  //     })
  //   }

  // }, [carts, door, setCartsNotPrinted, setRequestsToPrint]);

  useEffect(() => {
    //Remove printQueue sessionStorage
    if (
      door &&
      (!cartsNotPrinted.length || (!carts.length && !cartsNotPrinted.length))
    ) {
      sessionStorage.removeItem('printedQueue')
    }

    //Requests que ainda não foram impressos
    const requestsTable = cartsNotPrinted.some((req) => req.type === 'T')

    if (
      (tablesFetched && requestsTable ? tablesFetched : true) &&
      door &&
      cartsNotPrinted.length &&
      !cartsToPrint.length
    ) {
      const cartNotPrinted = cartsNotPrinted[0]
      if (cartNotPrinted) {
        let tableToPrint = cartNotPrinted.command?.opened?.table
        if (tableToPrint) {
          tableToPrint.opened = cartNotPrinted.command?.opened
        }
        if (!tableToPrint && cartNotPrinted.type === 'T') {
          updateTableBeforeClose()
            .then((result) => {
              tableToPrint = result
            })
            .catch((err) => console.error(err))
        }
        const envToPrint = () => {
          console.log(`${t('printing_up')}: `, cartNotPrinted.code)
          setPrintQueueActive(true)
          setRequestsToPrint({
            carts: [cartNotPrinted],
            directPrint: true,
            wsPrinting: true,
            appPrint: profile.options.print.app,
            type: cartNotPrinted.type,
            table: tableToPrint,
          })
        }

        if (audio) {
          audio.onended = () => {
            if (door) {
              envToPrint()
            }
          }
        }

        if (
          cartsNotPrinted.length > 3 &&
          !printQueueActive &&
          !alreadyPrintedLostRequests &&
          showLostRequestsModal
        ) {
          setShowLostRequestsModal((showLostState) => {
            if (showLostState) {
              setDoor((door) => false)
              handleConfirmModal({
                show: true,
                title: t('pending_prints'),
                message: `${t('there_are')} ${cartsNotPrinted.length} ${t('message_pending_print')}`,
                confirmButton: t('print_all'),
                actionConfirm() {
                  setPrintQueueActive(true)
                  audio?.load()
                  audio?.play().catch(() => {
                    console.error(`${t('could_not_play_sound')}`)
                    envToPrint()
                  })
                  setDoor(true)
                  setAlreadyPrintedLostRequests(true)
                },
                actionCancel: async () => {
                  if (session) {
                    for (const cart of cartsNotPrinted) {
                      await cart.setPrinted(session)
                    }

                    setCartsNotPrinted([])
                  }
                  setDoor(true)
                  setAlreadyPrintedLostRequests(true)
                },
              })
            }

            return false
          })
        } else if (cartsNotPrinted.length) {
          if (
            cartNotPrinted.status !== 'canceled' &&
            !profile.options.print.app
          ) {
            audio?.load()
            audio?.play().catch(() => {
              console.error(`${t('could_not_play_sound')}`)
              envToPrint()
            })
          }
        }
      } else {
        console.log(`${t('no_orders_print_up')}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [door, cartsNotPrinted, cartsToPrint, setRequestsToPrint, tablesFetched])

  const cancelRequestButton = (
    <SendStatusMessageForm
      profileOptions={profileOptions}
      cart={cartsToPrint[0]}
      newStatus={cartsToPrint[0]?.status === 'canceled' ? null : 'canceled'}
      button={{
        name:
          cartsToPrint[0]?.status === 'canceled'
            ? t('reinstate_order')
            : t('cancel_order'),
        props: {
          variant:
            cartsToPrint[0]?.status === 'canceled' ? 'primary' : 'danger',
          className: 'fs-7 w-100 text-nowrap',
          disabled: false,
        },
      }}
    />
  )

  useEffect(() => {
    if (requestsToPrint.directPrint) {
      if (!(profileOptions ?? profile.options).print.app) {
        if (timeout) {
          clearTimeout(timeout)
        }
        setDoor(false)
        handlePrint()
      } else if (!wsPrinting) {
        pushToPrint()
      }
    }
  }, [requestsToPrint])

  useEffect(() => {
    if (!cartEvents.eventNames().includes('newCartPackage')) {
      cartEvents.on('newCartPackage', () => {
        audio?.load()
        audio?.play().catch(() => {
          console.error(`${t('could_not_play_sound')}`)
        })
      })
    }
    return () => {
      cartEvents.removeAllListeners()
    }
  }, [])

  const [blobUrlPrint, setBlobUrlPrint] = useState('')

  return (
    <>
      {requestsToPrint.directPrint ? (
        <div
          className="table-container"
          style={{ position: 'absolute', zIndex: -99999, top: '-100%' }}
        >
          <NotePrint
            ref={componentRef}
            profile={{ ...profile, options: profileOptions ?? profile.options }}
            cart={cartsToPrint[0]}
            report={report}
            table={table}
            detailedTable={detaildTable}
          />
          {/* <CompTablePrint
            cart={cartsToPrint[0]}
            carts={cartsToPrint}
            copiesTimes={copiesTimes}
            componentRef={componentRef}
            classBold={
              (profileOptions ?? profile.options)?.print.bolder ?? true
                ? "fw-bold"
                : ""
            }
            fontSize={
              (profileOptions ?? profile.options)?.print.fontSize ?? 7
            }
            margin={(profileOptions ?? profile.options)?.print.margin ?? 0}
            paperSize={
              (profileOptions ?? profile.options)?.print.width === "302px"
                ? 72
                : 58
            }
            groupItems={
              (profileOptions ?? profile.options)?.print.groupItems ?? false
            }
            type={type}
            report={report}
            table={requestsToPrint.table}
            opened={requestsToPrint.table?.opened}
            command={requestsToPrint.command !== undefined ? requestsToPrint.command : null}
            autoPrint={() => {
              if(!profile.options.print.active) {
                return
              } 
              if (!(profileOptions ?? profile.options).print.app) {
                if (timeout) {
                  clearTimeout(timeout);
                }
                setDoor(false);
                handlePrint();
              } else if (!wsPrinting) {
                pushToPrint();
              }
            }}
            titleTable={titleTable}
            wsPrinting={wsPrinting}
          /> */}
        </div>
      ) : (
        <div
          onClick={(e) => {
            if (
              (e.target as HTMLElement).className.includes('fade modal show')
            ) {
              handleClose()
            }
          }}
        >
          <Modal
            show={!!requestsToPrint?.carts?.length && requestsToPrint.show}
            size="lg"
            scrollable
            // backdrop="static"
            keyboard={false}
            centered
            // backdropClassName="close-modal-backdrop"
            style={{ zIndex: 99999 }}
            onHide={handleClose}
          >
            <Modal.Header
              className="justify-content-between align-items-center  "
              closeButton
            >
              <h4 className="fw-bold ms-auto">
                {report
                  ? t('report_request')
                  : printerTest
                    ? t('teste_print_order')
                    : t('order_preview')}
              </h4>
            </Modal.Header>
            <Modal.Body className="p-0" style={{ overflowX: 'hidden' }}>
              <Row>
                <Col
                  sm={report || printerCenter ? '12' : '8'}
                  className="d-flex justify-content-center"
                >
                  <div
                    className="border-start border-end border-dark overflow-auto py-3"
                    style={{
                      width: 'auto',
                      padding: '0 1rem',
                      minHeight: '70vh',
                      maxHeight: '70vh',
                    }}
                  >
                    <div className="d-flex justify-content-center">
                      <NotePrint
                        ref={componentRef}
                        profile={{
                          ...profile,
                          options: profileOptions ?? profile.options,
                        }}
                        cart={cartsToPrint[0]}
                        report={report}
                        table={table}
                        printType={
                          type === 'command' || type === 'table'
                            ? type
                            : undefined
                        }
                        detailedTable={detaildTable}
                      />
                    </div>

                    {/* <div>
                      <CompTablePrint
                        carts={cartsToPrint}
                        copiesTimes={copiesTimes}
                        componentRef={componentRef}
                        classBold={
                          (profileOptions ?? profile.options)?.print.bolder ??
                            true
                            ? "fw-bold"
                            : ""
                        }
                        fontSize={
                          (profileOptions ?? profile.options)?.print
                            .fontSize ?? 7
                        }
                        margin={
                          (profileOptions ?? profile.options)?.print.margin ??
                          0
                        }
                        paperSize={
                          (profileOptions ?? profile.options)?.print.width ===
                            "302px"
                            ? 72
                            : 58
                        }
                        groupItems={
                          (profileOptions ?? profile.options)?.print
                            .groupItems ?? false
                        }
                        type={type}
                        report={report}
                        table={requestsToPrint.table}
                        opened={requestsToPrint.opened}
                        command={requestsToPrint.command !== undefined ? requestsToPrint.command : null}
                        titleTable={titleTable}
                      />
                    </div> */}
                  </div>
                </Col>
                {!report && !printerCenter && (
                  <Col
                    sm="4"
                    className="border-start d-flex align-items-center"
                  >
                    <Row className="w-100 mx-auto mt-2">
                      <Col className="d-flex flex-column gap-2">
                        {cartsToPrint[0] &&
                          !report &&
                          type !== 'table' &&
                          type !== 'command' && (
                            <>
                              <SendStatusMessageForm
                                profileOptions={profileOptions}
                                cart={cartsToPrint[0]}
                                newStatus="production"
                                button={{
                                  name:
                                    cartsToPrint[0].type !== 'T'
                                      ? t('received')
                                      : t('preparation'),
                                  props: {
                                    variant:
                                      cartsToPrint[0].status !== null
                                        ? 'outline-primary'
                                        : 'primary',
                                    className: 'fs-7',
                                    disabled:
                                      cartsToPrint[0]?.status === 'canceled',
                                  },
                                }}
                              />
                              <SendStatusMessageForm
                                profileOptions={profileOptions}
                                cart={cartsToPrint[0]}
                                newStatus="transport"
                                button={{
                                  name: !cartsToPrint[0].address
                                    ? t('ready_for_pickup')
                                    : cartsToPrint[0].type !== 'T'
                                      ? t('delivering')
                                      : t('served'),
                                  props: {
                                    variant:
                                      cartsToPrint[0].status === 'transport'
                                        ? 'outline-orange'
                                        : 'orange',
                                    className: 'fs-7 persist-outline',
                                    disabled:
                                      cartsToPrint[0]?.status === 'canceled',
                                  },
                                }}
                              />
                            </>
                          )}
                        {cartsToPrint[0] && cartsToPrint[0].type !== 'T' && (
                          <>
                            {window.innerWidth > 768 &&
                              !report &&
                              cancelRequestButton}
                            {(type === 'D' || type === 'P') && (
                              <SendStatusMessageForm
                                profileOptions={profileOptions}
                                cart={cartsToPrint[0]}
                                button={{
                                  name: t('speak_customer'),
                                  props: {
                                    variant: 'success',
                                    className: 'fs-7',
                                  },
                                }}
                              />
                            )}
                          </>
                        )}
                        {cartsToPrint[0]?.addressId &&
                          cartsToPrint[0]?.type !== 'T' && (
                            <Form.Select
                              defaultValue={cartsToPrint[0].motoboyId || ''}
                              onChange={(e) =>
                                cartsToPrint[0].setMotoboyId(
                                  parseInt(e.target.value),
                                  () => {
                                    setCart(cartsToPrint[0])
                                    if (session) {
                                      updateMotoboyId(
                                        cartsToPrint[0].id,
                                        parseInt(e.target.value),
                                        session
                                      )
                                    }
                                  }
                                )
                              }
                            >
                              <option>{t('select')}</option>
                              {motoboys.map(
                                (motoboy) =>
                                  motoboy.status && (
                                    <option key={motoboy.id} value={motoboy.id}>
                                      {motoboy.name}
                                    </option>
                                  )
                              )}
                            </Form.Select>
                          )}
                      </Col>
                    </Row>
                  </Col>
                )}
              </Row>
            </Modal.Body>
            <Modal.Footer className="py-4">
              <Row className="w-100 m-0 p-0">
                {cartsToPrint[0] && (
                  <>
                    <Col sm="4" className="px-1">
                      {window.innerWidth > 768 ? (
                        <Button
                          variant="outline-primary"
                          className=" fs-7 w-100 mt-1  text-nowrap"
                          onClick={handleClose}
                        >
                          <span className="align-middle">{t('close')}</span>
                        </Button>
                      ) : (
                        !report &&
                        (type === 'D' || type === 'P') &&
                        cancelRequestButton
                      )}
                    </Col>
                    <Col
                      sm="4"
                      className="d-flex align-items-center justify-content-center px-1"
                    >
                      {cartsToPrint[0].type === 'P' && !report && $btnAlterDate}
                      {report && cartsToPrint[0].type === 'T' && (
                        <Form.Switch
                          checked={detaildTable}
                          onChange={(e) => setDetaildTable(e.target.checked)}
                          className="my-auto"
                          label={t('detail_table')}
                          id="detailedTable"
                        />
                      )}
                    </Col>
                  </>
                )}
                <Col
                  sm="4"
                  className={`px-1 ${!cartsToPrint[0] ? 'ms-auto' : ''}`}
                >
                  <Button
                    variant="outline-secondary"
                    className=" fs-7 w-100 mt-1"
                    onClick={() => {
                      pushToPrint()
                    }}
                  >
                    <span className="align-middle">{t('print')}</span>
                  </Button>
                </Col>
              </Row>
            </Modal.Footer>
          </Modal>
          <>{cartsToPrint[0] && $alterDateModal(cartsToPrint[0])}</>
        </div>
      )}
    </>
  )
}
