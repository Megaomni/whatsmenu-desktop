import { signOut, useSession } from 'next-auth/react'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { Dispatch, SetStateAction, useContext, useEffect } from 'react'
import { Badge, Button, Dropdown, Navbar } from 'react-bootstrap'
import {
  BsList,
  BsEye,
  BsGear,
  BsWhatsapp,
  BsBoxArrowRight,
  BsPersonCircle,
  BsPrinter,
} from 'react-icons/bs'
import { ImTicket } from 'react-icons/im'
import { RiLockPasswordLine } from 'react-icons/ri'
import { GiRoundTable } from 'react-icons/gi'
import { AppContext } from '../../context/app.ctx'
import { useRouter } from 'next/router'
import { TableContext } from '../../context/table.ctx'
import { CartsContext } from '../../context/cart.ctx'
import { FaCashRegister } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

interface TopbarProps {
  showSidebar: boolean
  setShowSidebar: Dispatch<SetStateAction<boolean>>
}

export function Topbar(props: TopbarProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const router = useRouter()
  const {
    requestsToPackage,
    profile,
    setRequestsToPrint,
    requestsCount,
    setRequestsCount,
    plansCategory,
    bartenders,
    handleConfirmModal,
    user,
    currency,
  } = useContext(AppContext)

  const { carts, packageCarts } = useContext(CartsContext)

  const { tables } = useContext(TableContext)

  const { setShowSidebar, showSidebar } = props

  return (
    <header
      id="header"
      className="header fixed-top d-flex align-items-center ps-0"
      style={{ zIndex: 1050 }}
    >
      <Navbar.Toggle
        as="div"
        className="m-0 border-0"
        style={{ outline: 'none' }}
        onClick={() => setShowSidebar(!showSidebar)}
      >
        <BsList className="toggle-sidebar-btn ps-0" />
      </Navbar.Toggle>
      <div className="d-flex align-items-center justify-content-between">
        <Link href="/dashboard" className="logo d-flex align-items-center">
          {window.innerWidth <= 426 ? (
            <div className="mx-2">
              <Image
                src="/images/favicon.png"
                width={24}
                height={24}
                alt="logo"
              />
            </div>
          ) : (
            <span className={`mx-0`}>WhatsMenu</span>
          )}
        </Link>
      </div>
      {/* <!-- End Logo --> */}
      {!('isElectron' in window) && (
        <div
          className={`${window.innerWidth <= 426 ? 'me-1 ms-2' : 'options'} d-flex align-items-end gap-2`}
        >
          {profile.id &&
            ((profile.address.street && profile.taxDelivery.length > 0) ||
              plansCategory.every((plan) => plan === 'table')) && (
              <>
                <Button
                  as="a"
                  variant="outline-success"
                  size="sm"
                  className={`text-nowrap`}
                  href={`${process.env.WHATSMENU_BASE_URL}/${profile.slug}`}
                  target="_blank"
                >
                  <span className="with-icon">
                    <BsEye />
                    {window.innerWidth <= 426 ? null : (
                      <span>{t('view_menu')}</span>
                    )}
                  </span>
                </Button>
                <Button
                  as="a"
                  variant="outline-success"
                  size="sm"
                  className={`text-nowrap`}
                  href={`${process.env.WHATSMENU_BASE_URL}/${profile.slug}/pdv`}
                  target="_blank"
                >
                  <span className="with-icon">
                    <FaCashRegister />
                    {window.innerWidth <= 426 ? null : <span>{t('pos')}</span>}
                  </span>
                </Button>
                {plansCategory.includes('table') ? (
                  <Button
                    variant="outline-success"
                    size="sm"
                    className={`text-nowrap`}
                    onClick={() => {
                      if (
                        bartenders.filter((bartender) => !bartender.deleted_at)
                          .length
                      ) {
                        window.open(
                          `${process.env.WHATSMENU_BASE_URL}/${profile.slug}/${t('tables')}`,
                          '_blank'
                        )
                      } else {
                        handleConfirmModal({
                          title: t('no_active_waiter'),
                          message: t('message_register_waitr_enable'),
                          confirmButton: t('register_waiter'),
                          actionConfirm: () => {
                            router.push(
                              '/dashboard/settings/table?bartender=true'
                            )
                          },
                        })
                      }
                    }}
                  >
                    <GiRoundTable />
                    {window.innerWidth <= 426 ? null : (
                      <span>{t('waiter')}</span>
                    )}
                  </Button>
                ) : null}

                <Dropdown
                  autoClose="outside"
                  onToggle={(e) => !e && setRequestsCount(0)}
                  className="nav-link nav-icon position-relative p-0"
                >
                  <Badge
                    bg="danger"
                    pill
                    className={`${carts.filter((cart) => cart.status === null && cart.type === 'D').length > 0 ? '' : 'invisible'} position-absolute`}
                    style={{ top: -10, right: -10 }}
                  >
                    {
                      carts.filter(
                        (cart) => cart.status === null && cart.type !== 'P'
                      ).length
                    }
                  </Badge>
                  <Dropdown.Toggle
                    variant="outline-success"
                    className={`h-100 fw-normal m-0 px-2 ${window.innerWidth <= 426 && 'gap-0'}`}
                    size="sm"
                  >
                    <>
                      <ImTicket />
                      {window.innerWidth <= 426 ? null : (
                        <span>{t('orders')}</span>
                      )}
                    </>
                  </Dropdown.Toggle>

                  <Dropdown.Menu
                    className={`dropdown-menu-arrow dropdown-menu-end notifications`}
                    style={{
                      top: '2.1rem',
                      right: window.innerWidth < 768 ? '-200%' : 0,
                    }}
                  >
                    <Dropdown.Header className="text-wrap">
                      {t('you')}{' '}
                      {carts.filter(
                        (cart) => cart.status === null && cart.type === 'D'
                      ).length > 0
                        ? `${t('have')} ${carts.filter((cart) => cart.status === null && cart.type === 'D').length}`
                        : t('not_have')}{' '}
                      {t('new_orders')}
                    </Dropdown.Header>
                    {carts
                      .concat
                      // packageCarts.data.sort().sort((a, b) => b.code - a.code)
                      ()
                      .slice(0, 3)
                      .sort((a, b) => {
                        return a.status === null ? -1 : 1
                      })
                      .map((cartMap) => (
                        <div key={cartMap.code}>
                          <Dropdown.Divider />
                          <Dropdown.Item
                            className={`wm-request-${
                              cartMap.status === 'canceled'
                                ? 'canceled'
                                : cartMap.type === 'D'
                                  ? 'delivery'
                                  : cartMap.type === 'T'
                                    ? 'table'
                                    : 'package'
                            }-text border-top fs-8`}
                            onClick={() => {
                              setRequestsToPrint({
                                carts: [cartMap],
                                table: tables.find(
                                  (t) =>
                                    t.opened?.id ===
                                    t
                                      .activeCommands()
                                      .find((c) => c.id === cartMap.commandId)
                                      ?.tableOpenedId
                                ),
                                type: cartMap.type,
                                show: true,
                              })
                            }}
                          >
                            <div>
                              <h4 className="fs-5 d-flex justify-content-between">
                                <span
                                  className="d-inline-block overflow-hidden"
                                  style={{
                                    maxWidth: '150px',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  <BsPrinter className="me-2" />
                                  {cartMap.client?.name.slice(0, 15)}
                                </span>
                                <span className="fs-8">
                                  {cartMap.status === null && 'Não recebido'}
                                  {cartMap.status === 'production' &&
                                    'Recebido'}
                                  {cartMap.status === 'transport' &&
                                    'Transporte'}
                                  {cartMap.status === 'canceled' && 'Cancelado'}
                                </span>
                              </h4>
                              <span>
                                <b>{t('phone')}: </b>
                                {cartMap.client?.whatsapp}
                              </span>
                              <div className="d-flex justify-content-between">
                                <h5 className="fs-7 mt-2">
                                  wm{cartMap.code}-{cartMap.type}
                                </h5>
                                <div className="my-auto ms-5">
                                  <span>
                                    <b>Total:</b>
                                    <span>
                                      {currency({
                                        value: cartMap.total,
                                      })}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="d-flex gap-2"></div>
                          </Dropdown.Item>
                          <Dropdown.Divider />
                        </div>
                      ))}
                    <Dropdown.Header className="dropdown-footer">
                      <Link href="/dashboard/request">{t('go_to_orders')}</Link>
                    </Dropdown.Header>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            )}
        </div>
      )}

      <nav className="header-nav ms-auto">
        <ul className="d-flex align-items-center">
          {/* <Dropdown className="nav-link nav-icon position-relative">
            <span className="badge bg-primary badge-number">4</span>
            <Dropdown.Toggle variant="white" as={BsBell} fontSize={20} />
            <Dropdown.Menu
              className="dropdown-menu-arrow dropdown-menu-end notifications"
              style={{ top: "3rem", right: 0 }}
            >
              <Dropdown.Header>
                Você tem 4 notificações novas
                <Link href="#">
                  <a>
                    <span className="badge rounded-pill bg-primary p-2 ms-2">
                      Ver todas
                    </span>
                  </a>
                </Link>
              </Dropdown.Header>
              <Dropdown.Divider />
              <Dropdown.Item className="notification-item">
                
                  <BsExclamationCircle className="text-warning" />
                
                <div>
                  <h4>Lorem Ipsum</h4>
                  <p>Quae dolorem earum veritatis oditseno</p>
                  <p>30 min. ago</p>
                </div>
              </Dropdown.Item>
              <Dropdown.Divider />

              <Dropdown.Item className="notification-item">
                
                  <BsXCircle className="text-danger" />
                
                <div>
                  <h4>Atque rerum nesciunt</h4>
                  <p>Quae dolorem earum veritatis oditseno</p>
                  <p>1 hr. ago</p>
                </div>
              </Dropdown.Item>
              <Dropdown.Divider />

              <Dropdown.Item className="notification-item">
                
                  <BsCheckCircle className="text-success" />
                
                <div>
                  <h4>Sit rerum fuga</h4>
                  <p>Quae dolorem earum veritatis oditseno</p>
                  <p>2 hrs. ago</p>
                </div>
              </Dropdown.Item>
              <Dropdown.Divider />

              <Dropdown.Item className="notification-item">
                
                  <BsInfoCircle className="text-primary" />
                
                <div>
                  <h4>Dicta reprehenderit</h4>
                  <p>Quae dolorem earum veritatis oditseno</p>
                  <p>4 hrs. ago</p>
                </div>
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Header className="dropdown-footer">
                <a href="#">Mostrar Tudo</a>
              </Dropdown.Header>
            </Dropdown.Menu>
          </Dropdown> */}
          {/* <!-- End Notification Nav --> */}

          {/* <Dropdown className="nav-link nav-icon position-relative">
            <span className="badge bg-success badge-number">3</span>
            <Dropdown.Toggle
              variant="white"
              as={BsChatLeftText}
              fontSize={20}
            ></Dropdown.Toggle>

            <Dropdown.Menu
              className="dropdown-menu-end dropdown-menu-arrow messages"
              style={{ top: "3rem", right: 0 }}
            >
              <Dropdown.Header>
                Você tem 3 mensagens novas
                <Link href="#">
                  <a>
                    <span className="badge rounded-pill bg-primary p-2 ms-2">
                      Ver todas
                    </span>
                  </a>
                </Link>
              </Dropdown.Header>
              <Dropdown.Divider />

              <Dropdown.Item className="message-item">
                <a href="#">
                  <img
                    src="assets/img/messages-1.jpg"
                    alt=""
                    className="rounded-circle"
                  />

                  <div>
                    <h4>Maria Hudson</h4>
                    <p>
                      Velit asperiores et ducimus soluta repudiandae labore
                      officia est ut...
                    </p>
                    <p>4 hrs. ago</p>
                  </div>
                </a>
              </Dropdown.Item>
              <Dropdown.Divider />

              <Dropdown.Item className="message-item">
                <a href="#">
                  <img
                    src="assets/img/messages-2.jpg"
                    alt=""
                    className="rounded-circle"
                  />
                  <div>
                    <h4>Anna Nelson</h4>
                    <p>
                      Velit asperiores et ducimus soluta repudiandae labore
                      officia est ut...
                    </p>
                    <p>6 hrs. ago</p>
                  </div>
                </a>
              </Dropdown.Item>
              <Dropdown.Divider />

              <Dropdown.Item className="message-item">
                <a href="#">
                  <img
                    src="assets/img/messages-3.jpg"
                    alt=""
                    className="rounded-circle"
                  />
                  <div>
                    <h4>David Muldon</h4>
                    <p>
                      Velit asperiores et ducimus soluta repudiandae labore
                      officia est ut...
                    </p>
                    <p>8 hrs. ago</p>
                  </div>
                </a>
              </Dropdown.Item>
              <Dropdown.Divider />

              <Dropdown.Header className="dropdown-footer">
                <a href="#">Mostrar Tudo</a>
              </Dropdown.Header>
            </Dropdown.Menu>
          </Dropdown> */}
          {/* <!-- End Messages Nav --> */}
          <Dropdown
            className="nav-link nav-profile d-flex align-items-center p-2 ps-0"
            title={`${user?.email}`}
          >
            <Dropdown.Toggle
              id="userControls"
              variant="white"
              size="sm"
              className="justify-content-end "
            >
              {profile.logo ? (
                //eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logo}
                  width={25}
                  height={25}
                  style={{ borderRadius: '50%' }}
                  alt="logo"
                />
              ) : (
                <BsPersonCircle size={20} />
              )}
              {window.innerWidth <= 425 ? null : (
                <span>{user?.email?.substring(0, 18) + '...'}</span>
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-end dropdown-menu-arrow messages profile">
              <Dropdown.Header>
                <h6>{profile.name}</h6>
              </Dropdown.Header>
              <Dropdown.Divider />
              <Dropdown.Item href="#" className="d-flex align-items-center p-0">
                <Link
                  className="w-100"
                  href="/dashboard/settings"
                  legacyBehavior
                >
                  <span className="with-icon fw-normal w-100 px-3 py-2">
                    <BsGear size={19} />
                    {t('general_settings')}
                  </span>
                </Link>
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                rel="noreferrer"
                href="https://api.whatsapp.com/send/?phone=5511937036875&text=Preciso%20de%20ajuda"
                target="_blank"
                className="d-flex align-items-center p-0"
              >
                <span className="with-icon fw-normal w-100 px-3 py-2">
                  <BsWhatsapp size={19} />
                  {t('need_help')}
                </span>
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item href="#" className="d-flex align-items-center p-0">
                <Link
                  className="w-100"
                  href="/dashboard/settings/account"
                  legacyBehavior
                >
                  <span className="with-icon fw-normal w-100 px-3 py-2">
                    <RiLockPasswordLine size={19} />
                    {t('passwords')}
                  </span>
                </Link>
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item href="#" className="d-flex align-items-center p-0">
                <Link className="w-100" href="" legacyBehavior>
                  <span
                    className="with-icon fw-normal w-100 px-3 py-2"
                    onClick={() => signOut()}
                  >
                    <BsBoxArrowRight size={19} />
                    {t('exit')}
                  </span>
                </Link>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* <!-- End Profile Nav --> */}
        </ul>
      </nav>
      {/* <!-- End Icons Navigation --> */}
    </header>
  )
}
