import { useSession } from 'next-auth/react'
import { useCallback, useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Form, FormGroup, Row, Table } from 'react-bootstrap'
import { FaDownload, FaGooglePlay } from 'react-icons/fa'
import { HelpVideos } from '../../../components/Modals/HelpVideos'
import { OverlaySpinner } from '../../../components/OverlaySpinner'
import { Title } from '../../../components/Partials/title'
import { AppContext } from '../../../context/app.ctx'
import useLocalStorage from '../../../hooks/useLocalStorage'
import useWebPrint, { IWebPrinter } from '../../../hooks/useWebPrint'
import Cart from '../../../types/cart'
import Profile, { ProfileOptions } from '../../../types/profile'
import {
  apiRoute,
  compareItems,
  copy,
  encryptEmoji,
} from '../../../utils/wm-functions'
import { useWhatsAppBot } from '@hooks/useWhatsAppBot'
import { useTranslation } from 'react-i18next'
// import { responseLimit } from 'next/dist/server/api-utils'
//
export default function Settings() {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const [activeCashiers, setActiveCashiers] = useState(false)

  const { storeProfile } = useWhatsAppBot()

  async function getCashiers() {
    const { data } = await apiRoute(
      `/api/v2/business/${profile.slug}/cashiers`,
      session,
      'GET'
    )
    return setActiveCashiers(data)
  }

  useEffect(() => {
    getCashiers()
  }, [])

  const {
    profile,
    setProfile,
    handleShowToast,
    changeConfig,
    setChangeConfig,
    setRequestsToPrint,
    firsInteract,
    user,
    setWhatsmenuDesktopDownloaded,
    setPrintAppDownloaded,
    possibleMobile,
  } = useContext(AppContext)

  const [profileOptions, setProfileOptions] = useState<ProfileOptions>(
    profile.options
  )
  const [defaultDomain, setDefaultDomain] = useLocalStorage<string | null>(
    'defaultDomain',
    window.sessionStorage.getItem('defaultDomain'),
    'sessionStorage'
  )
  const [deliveryLocal, setDeliveryLocal] = useState<boolean>(
    profile.deliveryLocal
  )

  const [webPrintPrinters, setWebPrintPrinters] = useLocalStorage<
    IWebPrinter[]
  >('@whatsmenu-web-printers-1.0', [])

  const { getPrinters, requestBluetooth, requestUsb, browserIsCompatible } =
    useWebPrint()

  const showToast = useCallback(
    (type: 'success' | 'erro' | 'alert', title?: string, content?: string) => {
      handleShowToast({
        position: 'middle-center',
        type,
        title,
        content,
        show: true,
      })
    },
    [handleShowToast]
  )

  const saveGeralConfig = useCallback(
    async (noToast = false) => {
      if (changeConfig.changeState) {
        try {
          const data = {
            options: {
              ...profileOptions,
              store: {
                ...profileOptions.store,
                productModal: {
                  ...profileOptions.store.productModal,
                },
                catalogMode: {
                  ...profileOptions.store.catalogMode,
                },
              },
            },
            deliveryLocal,
          }

          data.options.placeholders.clientText = encryptEmoji(
            data.options.placeholders.clientText
          )
          data.options.placeholders.pizzaObs = encryptEmoji(
            data.options.placeholders.pizzaObs
          )
          data.options.placeholders.productObs = encryptEmoji(
            data.options.placeholders.productObs
          )
          data.options.placeholders.statusProduction = encryptEmoji(
            data.options.placeholders.statusProduction
          )
          data.options.placeholders.statusSend = encryptEmoji(
            data.options.placeholders.statusSend
          )
          data.options.placeholders.statusToRemove = encryptEmoji(
            data.options.placeholders.statusToRemove
          )
          data.options.placeholders.sendWhatsMessage = encryptEmoji(
            data.options.placeholders.sendWhatsMessage
          )
          data.options.placeholders.welcomeMessage = encryptEmoji(
            data.options.placeholders.welcomeMessage
          )

          const { data: prof } = await apiRoute(
            '/dashboard/settings/general',
            session,
            'PATCH',
            data
          )

          const profileUpdate = new Profile({ ...profile, ...prof })

          storeProfile(prof)

          setProfile(profileUpdate)
          !noToast && showToast('success', t('saved'), t('saved_successfully'))
          changeConfig.toRouter && changeConfig.toRouter()
        } catch (e) {
          console.error(e)
        }
      } else {
        !noToast &&
          showToast('erro', t('no_changes'), t('are_no_pending_changes'))
      }
    },
    [
      showToast,
      deliveryLocal,
      profileOptions,
      setProfile,
      session,
      changeConfig,
      profile,
    ]
  )

  useEffect(() => {
    if (changeConfig.changeState && changeConfig.confirmSave) {
      saveGeralConfig()
    }
  }, [changeConfig, saveGeralConfig])

  useEffect(() => {
    setProfileOptions(copy(profile.options))
    setDeliveryLocal(profile.deliveryLocal)
  }, [profile])

  useEffect(() => {
    const oldProfileOptions = {
      ...profile.options,
      deliveryLocal: profile.deliveryLocal,
    }
    const newProfileOptions = { ...profileOptions, deliveryLocal }

    setChangeConfig({
      changeState: !compareItems(oldProfileOptions, newProfileOptions),
    })
  }, [profile, profileOptions, deliveryLocal, setChangeConfig])

  useEffect(() => {
    if (profileOptions.print?.web) {
      getPrinters(profileOptions.print?.web).then((printers) => {
        setWebPrintPrinters((state) => {
          return printers.map((printer: any) => {
            const havePrinter = state.find(
              (localPrinter) => localPrinter.id === printer.id
            )
            if (havePrinter) {
              return { ...havePrinter }
            }
            return {
              id:
                profileOptions.print?.web === 'bluetooth'
                  ? printer.id
                  : printer.serialNumber,
              name:
                profileOptions.print?.web === 'bluetooth'
                  ? printer.name
                  : printer.productName,
              copies: 1,
              status: true,
            }
          })
        })
      })
    }
  }, [
    firsInteract,
    getPrinters,
    profileOptions.print?.web,
    setWebPrintPrinters,
    webPrintPrinters.length,
  ])

  useEffect(() => {
    if (!user?.controls?.print?.web && profileOptions.print?.web) {
      // setProfileOptions(state => ({ ...state, print: { ...state.print, web: '' }  }))

      saveGeralConfig(true)
    }
  }, [user?.controls?.print?.web, saveGeralConfig, profileOptions.print?.web])

  return (
    <div>
      <Title
        title={t('settings')}
        componentTitle={t('general_settings')}
        className="mb-4"
        child={[t('general')]}
      />
      <Row className="justify-content-end mb-4">
        <Col md="1" className="d-flex p-0">
          <Button
            variant="success"
            className="flex-grow-1"
            onClick={() => saveGeralConfig()}
          >
            {t('save')}
          </Button>
        </Col>
      </Row>
      <Row>
        <Card>
          <Card.Header className="d-flex gap-3">
            <h4>{t('deliverys')}</h4>
            <div className="vr"></div>
            <HelpVideos.Trigger
              urls={[
                {
                  src: 'https://www.youtube.com/embed/ZLFVeemNkWo',
                  title: t('deliverys'),
                },
              ]}
            />
          </Card.Header>
          <Card.Body>
            <Row>
              <Col>
                <FormGroup>
                  <Form.Check
                    type="switch"
                    id="O seu negócio faz entregas?"
                    label={`${t('business_offer_deliveries')}?`}
                    className="fs-7"
                    defaultChecked={!profileOptions.delivery.disableDelivery}
                    onChange={(e) => {
                      setProfileOptions({
                        ...profileOptions,
                        delivery: {
                          ...profileOptions.delivery,
                          disableDelivery: !e.target.checked,
                        },
                      })
                    }}
                  />
                </FormGroup>
              </Col>

              <Col>
                <FormGroup>
                  <Form.Check
                    type="switch"
                    id="O cliente pode retirar o pedido no local?"
                    label={`${t('customer_pick_up_order_onsite')}?`}
                    className="fs-7"
                    checked={deliveryLocal}
                    onChange={(e) => {
                      setDeliveryLocal(e.target.checked)
                    }}
                  />
                </FormGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Row>
      <Row>
        <Col className="px-0">
          <Row>
            <Col sm={12} md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex gap-3">
                  <h4>{t('cash_register')}</h4>
                  <div className="vr"></div>
                  <HelpVideos.Trigger
                    urls={[
                      {
                        src: 'https://www.youtube.com/embed/vIxOQZu3QKk',
                        title: t('cash_register'),
                      },
                    ]}
                  />
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <FormGroup>
                        <Form.Check
                          type="switch"
                          id="Ativar gerenciamento de caixa?"
                          label={`${t('active_cash_management')}?`}
                          disabled={activeCashiers}
                          checked={profileOptions.pdv?.cashierManagement}
                          onChange={(e) => {
                            setProfileOptions({
                              ...profileOptions,
                              pdv: {
                                ...profileOptions.pdv,
                                cashierManagement: e.target.checked,
                              },
                            })
                          }}
                        />
                      </FormGroup>
                      {activeCashiers ? (
                        <p className="mt-3">
                          {t('message_currently_open_cash')}{' '}
                          <a
                            href={`${process.env.WHATSMENU_BASE_URL}/${profile.slug}/pdv`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('pos')}
                          </a>{' '}
                          {t('before_register_management')}.
                        </p>
                      ) : null}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={12} md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h4>{t('customers')}</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <FormGroup>
                        <Form.Check
                          type="switch"
                          id="Exibir Data de Nascimento?"
                          label={`${t('display_date_birth')}?`}
                          className="fs-7"
                          checked={profileOptions.pdv?.clientConfig?.birthDate}
                          onChange={(e) => {
                            setProfileOptions({
                              ...profileOptions,
                              pdv: {
                                ...profileOptions.pdv,
                                clientConfig: {
                                  birthDate: e.target.checked,
                                  required:
                                    profileOptions.pdv?.clientConfig?.required,
                                },
                              },
                            })
                          }}
                        />
                      </FormGroup>
                    </Col>
                    {profileOptions.pdv?.clientConfig?.birthDate && (
                      <Col>
                        <FormGroup>
                          <Form.Check
                            type="switch"
                            id="Obrigar data de nascimento"
                            label={`${t('require_date_birth')}?`}
                            className="fs-7"
                            disabled={
                              !profileOptions.pdv?.clientConfig.birthDate
                            }
                            checked={profileOptions.pdv?.clientConfig.required}
                            onChange={(e) => {
                              if (profileOptions.pdv?.clientConfig) {
                                setProfileOptions({
                                  ...profileOptions,
                                  pdv: {
                                    ...profileOptions.pdv,
                                    clientConfig: {
                                      ...profileOptions.pdv?.clientConfig,
                                      required: e.target.checked,
                                    },
                                  },
                                })
                              }
                            }}
                          />
                        </FormGroup>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row>
        <Card>
          <Card.Header>
            <div className="d-flex gap-3">
              <h4>{t('default_texts')}</h4>
              <div className="vr"></div>
              <HelpVideos.Trigger
                urls={[
                  {
                    src: 'https://www.youtube.com/embed/Qwrf_7uwUPw',
                    title: t('changing_default_text_observations'),
                  },
                ]}
              />
            </div>
          </Card.Header>
          <Card.Body>
            <Form>
              <Row>
                <Col sm>
                  <Form.Group>
                    <Form.Label className="fs-7 mt-md-0 mt-3">
                      {t('product_note')}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder={t('example_no_mayonnaise')}
                      defaultValue={profileOptions.placeholders.productObs}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          placeholders: {
                            ...profileOptions.placeholders,
                            productObs: e.target.value,
                          },
                        })
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col sm>
                  <Form.Group>
                    <Form.Label className="fs-7 mt-md-0 mt-3">
                      {t('pizza_note')}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder={t('leave_any_note_product_here')}
                      defaultValue={profileOptions.placeholders.pizzaObs}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          placeholders: {
                            ...profileOptions.placeholders,
                            pizzaObs: e.target.value,
                          },
                        })
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col sm>
                  <Form.Group>
                    <Form.Label className="fs-7 mt-md-0 mt-3">
                      {t('speak_customer')}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder={`${t('message_client')} `}
                      defaultValue={profileOptions.placeholders.clientText}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          placeholders: {
                            ...profileOptions.placeholders,
                            clientText: e.target.value,
                          },
                        })
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <br />
              <Row>
                <Col sm>
                  <Form.Group>
                    <Form.Label className="fs-7 mt-md-0 mt-3">
                      {t('status_received')}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder={t('you_order_production')}
                      defaultValue={
                        profileOptions.placeholders.statusProduction
                      }
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          placeholders: {
                            ...profileOptions.placeholders,
                            statusProduction: e.target.value,
                          },
                        })
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col sm>
                  <Form.Group>
                    <Form.Label className="fs-7 mt-md-0 mt-3">
                      {t('status_delivering')}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder={t('yay_order_already_way')}
                      defaultValue={profileOptions.placeholders.statusSend}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          placeholders: {
                            ...profileOptions.placeholders,
                            statusSend: e.target.value,
                          },
                        })
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col sm>
                  <Form.Group>
                    <Form.Label className="fs-7 mt-md-0 mt-3">
                      {t('status_pickup')}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder={t('order_ready_pickup')}
                      defaultValue={profileOptions.placeholders.statusToRemove}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          placeholders: {
                            ...profileOptions.placeholders,
                            statusToRemove: e.target.value,
                          },
                        })
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col sm>
                  <Form.Group>
                    <Form.Label className="fs-7 mt-md-0 mt-3">
                      {t('order_status_pos')}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder={t('order_successfully_placed')}
                      defaultValue={
                        profileOptions.placeholders.sendWhatsMessage
                      }
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          placeholders: {
                            ...profileOptions.placeholders,
                            sendWhatsMessage: e.target.value,
                          },
                        })
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <br />
              {'isElectron' in window && (
                <Row>
                  <Col sm>
                    <Form.Group>
                      <Form.Label className="fs-7 mt-md-0 mt-3">
                        {t('greeting_message')}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        placeholder={`${t('message_hello')}\n${t('welcome_to')} ${profile.name}🥳\n${t(
                          'check_menu_order'
                        )}👇\n\nhttps://www.whatsmenu.com.br/${profile.slug}\n\n👆🏻 *${t('exclusive_offers')}* 👆🏻 🚀\n\n${t('team')} ${profile.name}`}
                        defaultValue={
                          profileOptions.placeholders.welcomeMessage
                        }
                        onChange={(e) => {
                          setProfileOptions({
                            ...profileOptions,
                            placeholders: {
                              ...profileOptions.placeholders,
                              welcomeMessage: e.target.value,
                            },
                          })
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Form>
          </Card.Body>
        </Card>
      </Row>
      <Row>
        <Card>
          <Card.Header>
            <h4>{t('printer')}</h4>
          </Card.Header>
          <Card.Body>
            <Form>
              <Row>
                {!('isElectron' in window) && (
                  <Col sm="12" md>
                    <Form.Check
                      type="switch"
                      id="Usar impressora?"
                      label={`${t('use_printer')}?`}
                      className="fs-7 mt-2"
                      defaultChecked={profileOptions.print.active}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          print: {
                            ...profileOptions.print,
                            active: e.target.checked,
                          },
                        })
                      }}
                    />
                  </Col>
                )}
                <Col sm="12" md>
                  <Form.Check
                    type="switch"
                    id="Agrupar itens de pedidos para impressão?"
                    label={`${t('group_order_printing')}?`}
                    className="fs-7 mt-2"
                    checked={profileOptions.print.groupItems}
                    onChange={(e) => {
                      setProfileOptions({
                        ...profileOptions,
                        print: {
                          ...profileOptions.print,
                          groupItems: e.target.checked,
                        },
                      })
                    }}
                  />
                </Col>
                {/* <Col sm="12" md>
                  <Form.Check
                    type="switch"
                    id="Negrito?"
                    label="Negrito?"
                    disabled={profileOptions.print.textOnly}
                    className="fs-7 mt-2"
                    checked={profileOptions.print.bolder ?? true}
                    onChange={(e) => {
                      setProfileOptions({
                        ...profileOptions,
                        print: {
                          ...profileOptions.print,
                          bolder: e.target.checked,
                        },
                      });
                    }}
                  />
                </Col> */}
                {/* {} */}
                <Col sm="12" md>
                  <Button
                    className="w-100 my-md-0 my-4"
                    onClick={() => {
                      setRequestsToPrint({
                        titleTable: t('print_test'),
                        carts: [Cart.cartPrint()],
                        profileOptions,
                        printerTest: true,
                        printerCenter: true,
                        show: true,
                      })
                    }}
                  >
                    {t('test_print')}
                  </Button>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col sm="12" md={profile.options.print.app ? '4' : undefined}>
                  <Form.Group>
                    <Form.Label className="fs-7 text-nowrap">
                      {t('printer_driver')}
                    </Form.Label>
                    <Form.Select
                      value={
                        profileOptions.print.app
                          ? 'app'
                          : !!profileOptions.print?.web
                            ? profileOptions.print?.web
                            : String(profileOptions.print.textOnly)
                      }
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          print: {
                            ...profileOptions.print,
                            textOnly:
                              e.target.value === 'bluetooth' ||
                                e.target.value === 'usb' ||
                                e.target.value === 'app'
                                ? true
                                : copy(e.target.value, 'parse'),
                            app: e.target.value === 'app' ? true : false,
                            web:
                              e.target.value === 'bluetooth' ||
                                e.target.value === 'usb'
                                ? e.target.value
                                : '',
                          },
                        })
                      }}
                    >
                      <option value="true">Generic / Text Only</option>
                      <option value="false">{t('others')}</option>
                      <option value="app">{t('printing_app')}</option>
                      {browserIsCompatible() && navigator.userAgent ? (
                        <>
                          {/* <option value="bluetooth">Bluetooth</option> */}
                          <option value="usb">USB</option>
                        </>
                      ) : null}
                      {/* <option value="smartphone">Smartphone</option> */}
                    </Form.Select>
                  </Form.Group>
                </Col>
                {!profileOptions.print.app ? (
                  <>
                    {!('isElectron' in window) && (
                      <Col sm="12" md>
                        <Form.Group>
                          <Form.Label className="fs-7 mt-md-0 mt-3 text-nowrap">
                            {t('print_width')}
                          </Form.Label>
                          <Form.Select
                            value={profileOptions.print.width}
                            onChange={(e) => {
                              setProfileOptions({
                                ...profileOptions,
                                print: {
                                  ...profileOptions.print,
                                  width: e.target.value,
                                },
                              })
                            }}
                          >
                            <option value="219px">58mm</option>
                            <option value="302px">80mm</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                    {!JSON.parse(String(profileOptions.print.textOnly)) && (
                      <Col sm="12" md>
                        {/* {(!JSON.parse(String(profileOptions.print.textOnly)) && !JSON.parse(String(profileOptions.print.app ?? null))) && <Col sm="12" md> */}
                        <Form.Group>
                          <Form.Label className="fs-7 mt-md-0 mt-3 text-nowrap">
                            {t('letters')}
                          </Form.Label>
                          <Form.Select
                            value={profileOptions.print.fontSize || 7}
                            disabled={profileOptions.print.textOnly}
                            onChange={(e) => {
                              setProfileOptions({
                                ...profileOptions,
                                print: {
                                  ...profileOptions.print,
                                  fontSize: Number(e.target.value),
                                },
                              })
                            }}
                          >
                            <option value={7}>{t('small')}</option>
                            <option value={6}>{t('large')}</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                    {!('isElectron' in window) && (
                      <Col sm="12" md>
                        <Form.Group>
                          <Form.Label className="fs-7 mt-md-0 mt-3 ">
                            {t('copies')}
                          </Form.Label>
                          <Form.Control
                            type="number"
                            placeholder="1"
                            min="1"
                            defaultValue={profileOptions.print.copies}
                            onChange={(e) => {
                              e.target.value =
                                Number(e.target.value) <= 0
                                  ? '1'
                                  : e.target.value
                              const value = isNaN(parseInt(e.target.value))
                                ? 1
                                : parseInt(e.target.value)

                              setProfileOptions({
                                ...profileOptions,
                                print: {
                                  ...profileOptions.print,
                                  copies: value,
                                },
                              })
                            }}
                          />
                        </Form.Group>
                      </Col>
                    )}
                  </>
                ) : (
                  <Col className="d-flex flex-column align-items-center m-md-3 mt-3">
                    <p className="m-0 text-center">
                      {t('necessary_whatsmenu_android_installed')}
                    </p>
                    {possibleMobile && (
                      <Button
                        as="a"
                        target="_blank"
                        className="d-flex align-items-center gap-2"
                        variant="link"
                        href="https://play.google.com/store/apps/details?id=com.whatsmenu.whatsmenuprintv2"
                        onClick={() => {
                          setPrintAppDownloaded(true)
                          setWhatsmenuDesktopDownloaded(true)
                        }}
                      >
                        <FaGooglePlay />
                        <span>{t('message_download_gplay')}</span>
                      </Button>
                    )}
                  </Col>
                )}
              </Row>
              <br />
            </Form>
            {profileOptions.print?.web ? (
              <Table responsive bordered striped className="w-100 m-0 my-4">
                <thead>
                  <tr>
                    <th>{t('printer')}</th>
                    <th>{t('copies')}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tfoot>
                  <tr>
                    <td colSpan={3}>
                      <div className="d-flex justify-content-end">
                        <Button
                          onClick={async () => {
                            if (profileOptions.print?.web) {
                              try {
                                profileOptions.print?.web === 'bluetooth'
                                  ? await requestBluetooth()
                                  : await requestUsb()
                              } catch (error) {
                                console.error(error)
                                throw error
                              }
                              // getPrinters(profileOptions.print?.web)
                              //   .then(printers => {
                              //     setWebPrintPrinters(state => {
                              //       return printers.map((printer: any) => {
                              //         const havePrinter = state.find(localPrinter => localPrinter.id === printer.id)
                              //         if (havePrinter) {
                              //           return { ...havePrinter }
                              //         }
                              //         return {
                              //           id: profileOptions.print?.web === "bluetooth" ? printer.id : printer.serialNumber,
                              //           name: profileOptions.print?.web === "bluetooth" ? printer.name : printer.productName,
                              //           copies: 1,
                              //           status: true
                              //         }
                              //       })
                              //     })
                              //   })
                            }
                          }}
                        >
                          {t('add')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tfoot>
                <tbody>
                  {webPrintPrinters.map((webPrinter) => (
                    <tr key={webPrinter.id}>
                      <td>{webPrinter.name}</td>
                      <td width="25%">
                        <Form.Control
                          type="number"
                          min={1}
                          defaultValue={webPrinter.copies}
                          onChange={(e) => {
                            e.target.value =
                              Number(e.target.value) <= 0 ? '1' : e.target.value
                            setWebPrintPrinters((state) => {
                              const havePrinter = state.find(
                                (localPrinter) =>
                                  localPrinter.id === webPrinter.id
                              )
                              if (havePrinter) {
                                havePrinter.copies = Number(e.target.value)
                              }
                              return [...state]
                            })
                          }}
                        />
                      </td>
                      <td>
                        <Form.Switch
                          checked={webPrinter.status}
                          onChange={(e) => {
                            setWebPrintPrinters((state) => {
                              const havePrinter = state.find(
                                (localPrinter) =>
                                  localPrinter.id === webPrinter.id
                              )
                              if (havePrinter) {
                                havePrinter.status = e.target.checked
                              }
                              return [...state]
                            })
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : null}
          </Card.Body>
        </Card>
      </Row>
      <Row>
        <Col className="px-0">
          <Row>
            <Col sm="12" md="4" className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex gap-3">
                  <h4>{t('pizza_options')}</h4>
                  <div className="vr"></div>
                  <HelpVideos.Trigger
                    urls={[
                      {
                        src: 'https://www.youtube.com/embed/HjFpS-kJerA',
                        title: t('pizza_options'),
                      },
                    ]}
                  />
                </Card.Header>
                <Card.Body>
                  <div>
                    <Form.Check
                      type="switch"
                      id="Atribuir valor da mais cara?"
                      label={`${t('assign_price_most_expensive')}?`}
                      className="fs-7"
                      defaultChecked={profileOptions.pizza.higherValue}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          pizza: {
                            ...profileOptions.pizza,
                            higherValue: e.target.checked,
                          },
                        })
                      }}
                    />
                  </div>
                  <div>
                    <Form.Check
                      type="switch"
                      id="Permitir borda para cada sabor?"
                      label={`${t('different_crusts_each_flavor')}?`}
                      className="fs-7"
                      defaultChecked={profileOptions.pizza.multipleBorders}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          pizza: {
                            ...profileOptions.pizza,
                            multipleBorders: e.target.checked,
                          },
                        })
                      }}
                    />
                  </div>
                  <div>
                    <Form.Check
                      type="switch"
                      id="Permitir complementos para cada sabor?"
                      label={`${t('allow_each_flavor')}?`}
                      className="fs-7"
                      checked={profileOptions.pizza.multipleComplements}
                      onChange={(e) => {
                        setProfileOptions({
                          ...profileOptions,
                          pizza: {
                            ...profileOptions.pizza,
                            multipleComplements: e.target.checked,
                          },
                        })
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm="12" md="4" className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex gap-3">
                  <h4>{t('stock_options')}</h4>
                  <div className="vr"></div>
                  <HelpVideos.Trigger
                    urls={[
                      {
                        src: 'https://www.youtube.com/embed/H8eZMWDN8Yg',
                        title: t('stock_options'),
                      },
                    ]}
                  />
                </Card.Header>
                <Card.Body>
                  <Form.Switch
                    id="invetoryControl"
                    label={t('enable_stock_control')}
                    className="fs-7"
                    defaultChecked={profile.options.inventoryControl ?? false}
                    onChange={(e) => {
                      if (profile) {
                        setProfileOptions({
                          ...profileOptions,
                          inventoryControl: e.target.checked,
                        })
                      }
                    }}
                  />
                  <Form.Check
                    type="switch"
                    id='Exibir status de "esgotado" em produtos e complementos pausados?'
                    label={`${t('display_out_of_stock_product_addons')}?`}
                    className="fs-7"
                    defaultChecked={
                      profileOptions.disponibility.showProductsWhenPaused
                    }
                    onChange={(e) => {
                      setProfileOptions({
                        ...profileOptions,
                        disponibility: {
                          ...profileOptions.disponibility,
                          showProductsWhenPaused: e.target.checked,
                        },
                      })
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col sm="12" md="4" className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex gap-3">
                  <h4>{t('layout_options')}</h4>
                  <div className="vr"></div>
                  <HelpVideos.Trigger
                    urls={[
                      {
                        src: 'https://www.youtube.com/embed/cH8PTl15uNM',
                        title: t('layout_options'),
                      },
                    ]}
                  />
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="switch"
                    id="Cpf"
                    label={`${t('hide_ssn_receipt')}?`}
                    className="fs-7"
                    defaultChecked={profileOptions.hideSecretNumber}
                    onChange={(e) => {
                      setProfileOptions({
                        ...profileOptions,
                        hideSecretNumber: e.target.checked,
                      })
                    }}
                  />
                  <Form.Check
                    type="switch"
                    id="switch-info-position"
                    label={`${t('description_top_product_page')}`}
                    className="fs-7"
                    checked={
                      profileOptions.store.productModal.infoPosition === 'first'
                    }
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      setProfileOptions({
                        ...profileOptions,
                        store: {
                          ...profileOptions.store,
                          productModal: {
                            ...profileOptions.store.productModal,
                            infoPosition: isChecked ? 'first' : 'last',
                          },
                        },
                      })
                    }}
                  />
                  <Form.Check
                    type="switch"
                    id="catalog-mode-delivery"
                    label={t('activate_catalog_mode_delivery')}
                    className="fs-7"
                    checked={profileOptions.store.catalogMode.delivery}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      setProfileOptions({
                        ...profileOptions,
                        store: {
                          ...profileOptions.store,
                          catalogMode: {
                            ...profileOptions.store.catalogMode,
                            delivery: isChecked ? true : false,
                          },
                        },
                      })
                    }}
                  />
                  <Form.Check
                    type="switch"
                    id="catalog-mode-table"
                    label={t('activate_catalog_the_table')}
                    className="fs-7"
                    checked={profileOptions.store.catalogMode.table}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      setProfileOptions({
                        ...profileOptions,
                        store: {
                          ...profileOptions.store,
                          catalogMode: {
                            ...profileOptions.store.catalogMode,
                            table: isChecked ? true : false,
                          },
                        },
                      })
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col sm="12" md="4" className="mb-4">
              {!('isElectron' in window) &&
                navigator.userAgent.includes('Windows NT 10') ? (
                <Card className="h-100">
                  <Card.Header>
                    <h4>WhatsMenu Desktop</h4>
                  </Card.Header>
                  <Card.Body>
                    <ul>
                      <li>🤖 {t('message_virtual_assistant')}</li>
                      <li>👽 {t('message_automated_sales_bot')}</li>
                      <li>😎 {t('message_status_updates')}</li>
                    </ul>
                    <Button
                      as="a"
                      className="d-flex align-itens-center gap-2"
                      variant="link"
                      href="https://whatsmenu-desktop-update-server.vercel.app/download"
                      onClick={() => setWhatsmenuDesktopDownloaded(true)}
                      download
                    >
                      <FaDownload className="mt-1" />{' '}
                      {t('message_download_app')}
                    </Button>
                  </Card.Body>
                </Card>
              ) : null}
            </Col>
            <Col sm="12" md="4" className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h4>{t('automations')}</h4>
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="switch"
                    id="sendWhatsMessage"
                    label={`${t('send_status_page_pos_customer')}?`}
                    className="fs-7"
                    defaultChecked={profileOptions.pdv.sendWhatsMessage}
                    onChange={(e) => {
                      setProfileOptions({
                        ...profileOptions,
                        pdv: {
                          ...profileOptions.pdv,
                          sendWhatsMessage: e.target.checked,
                        },
                      })
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row className="justify-content-end">
        <Col md="1" className="d-flex p-0">
          <Button
            variant="success"
            className="flex-grow-1"
            onClick={() => saveGeralConfig()}
          >
            {t('save')}
          </Button>
        </Col>
      </Row>
      <OverlaySpinner
        show={!!changeConfig.confirmSave}
        queryElement={'body'}
        width={100}
        weight={10}
        textSpinner={`${t('saving')}`}
        backgroundColor={'transparent'}
        backdropBlur={4}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />
    </div>
  )
}
