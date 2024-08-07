import { DateTime } from 'luxon'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useContext } from 'react'
import { Accordion, Button } from 'react-bootstrap'
import { BiDollar } from 'react-icons/bi'
import {
  BsBoxArrowRight,
  BsBullseye,
  BsCalendar2Date,
  BsCalendar3,
  BsCalendarEvent,
  BsCardList,
  BsCashCoin,
  BsClipboardData,
  BsFilePerson,
  BsFillCloudyFill,
  BsFillFileEarmarkArrowUpFill,
  BsFunnel,
  BsGear,
  BsMegaphone,
  BsPerson,
} from 'react-icons/bs'
import { FaBarcode, FaCashRegister, FaFileInvoiceDollar, FaList, FaMedal, FaMoneyBillWave, FaMotorcycle } from 'react-icons/fa'
import { GiRoundTable } from 'react-icons/gi'
import { GoPackage } from 'react-icons/go'
import { ImCogs, ImTicket } from 'react-icons/im'
import { IoTicketOutline } from 'react-icons/io5'
import { MdVideoSettings } from 'react-icons/md'
import { RiRestaurantLine } from 'react-icons/ri'
import { AppContext } from '../../context/app.ctx'
import { updates } from '../../utils/update'
import { textPackage } from '../../utils/wm-functions'

interface ISessionUser extends Session {
  user: any
}

export function Sidebar() {
  const {
    invoicePending,
    profile,
    plansCategory,
    handleConfirmModal,
    changeConfig,
    setChangeConfig,
    setShowSidebar,
    bartenders,
    user,
    lowStockAlert,
    setShowNewFeatureModal,
  } = useContext(AppContext)
  const invoiceAlert = invoicePending?.invoice?.overdue ? 'danger' : 'warning'

  const router = useRouter()

  const verificationStateRouter = useCallback(
    (e: any, logout?: boolean) => {
      window.innerWidth < 1020 && setShowSidebar(false)

      if (changeConfig?.changeState) {
        e.preventDefault()
        const target = e.target.nodeName === 'SPAN' ? 'currentTarget' : 'target'
        const urlRedirect = e[target].href.substr(e[target].href.indexOf('/dashboard'))
        handleConfirmModal({
          show: true,
          confirmButton: 'Salvar',
          cancelButton: 'Descartar',
          title: 'Alterações Pendentes',
          message: 'Existem alterações não salvas, deseja salvar?',
          actionConfirm: () => {
            setChangeConfig({
              changeState: true,
              confirmSave: true,
              toRouter() {
                setChangeConfig({})
                logout ? signOut() : router.push(urlRedirect)
              },
            })
          },
          actionCancel: () => {
            setChangeConfig({})
            logout ? signOut() : router.push(urlRedirect)
          },
        })
      } else if (logout) {
        signOut()
      }
    },
    [router, handleConfirmModal, changeConfig, setChangeConfig, setShowSidebar]
  )

  return (
    <>
      <ul className="sidebar-nav" id="sidebar-nav">
        {profile.id && ((profile.address.street && profile.taxDelivery.length > 0) || plansCategory.every((plan) => plan === 'table')) && (
          <>
            {/* <li className="nav-item">
              <Link href="/dashboard">
                <Link className="with-icon nav-link collapsed"
                  onClick={e => {
                    verificationStateRouter(e);
                  }}>
                  <BsGrid />
                  <span>Dashboard</span>
                </Link>
              </Link>
            </li> */}
            <li className="nav-item">
              <Link
                href="/dashboard/request"
                className="with-icon nav-link collapsed"
                onClick={(e) => {
                  verificationStateRouter(e)
                }}
              >
                <ImTicket />
                <span>Pedidos</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/dashboard/settings/cashback"
                className="with-icon nav-link collapsed"
                onClick={(e) => {
                  verificationStateRouter(e)
                  window.innerWidth < 1020 && setShowSidebar(false)
                }}
              >
                <BsCashCoin />
                <span>Cashback</span>
                <span className="badge bg-danger inline ms-3">Novo</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/dashboard/menu"
                className="with-icon nav-link collapsed"
                onClick={(e) => {
                  verificationStateRouter(e)
                }}
              >
                <BsCardList />
                <span>Cardápio</span>
                {lowStockAlert() && (
                  <span style={{ left: '2px' }} className="position-relative translate-middle p-1 bg-warning border border-warning rounded-circle">
                    <span className="visually-hidden">Estoque</span>
                  </span>
                )}
              </Link>
            </li>
          </>
        )}
        {(user?.controls?.paymentInfo?.gateway ? user.controls.paymentInfo?.subscription?.status === 'active' : true) && (
          <li className="nav-item">
            <Link
              href="/dashboard/profile"
              className="with-icon nav-link collapsed"
              onClick={(e) => {
                verificationStateRouter(e)
              }}
            >
              <BsPerson />
              <span>Meu Perfil</span>
            </Link>
          </li>
        )}
        {profile.id && ((profile.address.street && profile.taxDelivery.length > 0) || plansCategory.every((plan) => plan === 'table')) && (
          <>
            <li className="nav-item">
              <Link
                href="/dashboard/motoboys"
                className="with-icon nav-link collapsed"
                onClick={(e) => {
                  // verificationStateRouter(e);
                }}
              >
                <FaMotorcycle />
                <span>Entregadores</span>
              </Link>
            </li>
            {plansCategory.some((plan) => plan === 'table') && !('isElectron' in window) && (
              <li className="nav-item">
                <Link
                  href={`${process.env.WHATSMENU_BASE_URL}/${profile.slug}/mesas`}
                  className="with-icon nav-link collapsed"
                  onClick={(e) => {
                    if (bartenders.filter((bartender: any) => !bartender.deleted_at).length) {
                      verificationStateRouter(e)
                    } else {
                      handleConfirmModal({
                        title: 'Nenhum garçom ativo',
                        message: 'Para registrar um garçom ou habilitar um já existente vá em Configurações > Mesa > na aba de Garçons, ou clique em',
                        confirmButton: 'Cadastrar Garçom',
                        actionConfirm: () => {
                          router.push('/dashboard/settings/table?bartender=true')
                        },
                      })
                    }
                  }}
                  target="_blank"
                >
                  <GiRoundTable />
                  <span>Garçom</span>
                </Link>
              </li>
            )}
            {!('isElectron' in window) && (
              <li className="nav-item">
                <Link
                  href={`${process.env.WHATSMENU_BASE_URL}/${profile.slug}/pdv`}
                  className="with-icon nav-link collapsed"
                  onClick={(e) => {
                    verificationStateRouter(e)
                  }}
                  target="_blank"
                >
                  <FaCashRegister />
                  <span> PDV</span>
                </Link>
              </li>
            )}
            {!plansCategory.every((plan) => plan === 'table') && (
              <li className="nav-item">
                <Link
                  href="/dashboard/cupons"
                  className="with-icon nav-link collapsed"
                  onClick={(e) => {
                    verificationStateRouter(e)
                  }}
                >
                  <IoTicketOutline />
                  <span>Cupons</span>
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link
                href="/dashboard/socialmedia"
                className="with-icon nav-link collapsed"
                onClick={(e) => {
                  verificationStateRouter(e)
                }}
              >
                <BsMegaphone />
                <span>Mídia Social</span>
              </Link>
            </li>

            <li className="nav-item">
              <Accordion id="relatorio-nav" defaultActiveKey="0" flush>
                <Accordion.Header as="a" bsPrefix="with-icon nav-link collapsed" style={{ color: 'white !important' }}>
                  <BsClipboardData />
                  <span>Relatórios</span>
                </Accordion.Header>
                <Accordion.Body style={{ marginLeft: '1.2rem', color: 'white' }}>
                  <Link
                    href="/dashboard/report/finance"
                    className="with-icon nav-link collapsed"
                    onClick={(e) => {
                      verificationStateRouter(e)
                    }}
                  >
                    <FaMoneyBillWave />
                    <span>Relatório Financeiro</span>
                  </Link>
                  <Link
                    href="/dashboard/report/daily"
                    className="with-icon nav-link collapsed"
                    onClick={(e) => {
                      verificationStateRouter(e)
                    }}
                  >
                    <BsCalendarEvent />
                    <span>Pedidos Diários</span>
                  </Link>
                  <Link
                    href="/dashboard/report/monthly"
                    className="with-icon nav-link collapsed"
                    onClick={(e) => {
                      verificationStateRouter(e)
                    }}
                  >
                    <BsCalendar3 />
                    <span>Pedidos Mensais</span>
                  </Link>
                  <Link
                    href="/dashboard/report/cashier"
                    className="with-icon nav-link collapsed"
                    onClick={(e) => {
                      // verificationStateRouter(e);
                    }}
                  >
                    <span className="with-icon">
                      <FaCashRegister />
                      <span>Fechamento Caixa</span>
                    </span>
                  </Link>
                  <Link
                    href="/dashboard/report/bestSellers"
                    className="with-icon nav-link collapsed"
                    onClick={(e) => {
                      verificationStateRouter(e)
                    }}
                  >
                    <FaMedal />
                    <span>Mais Vendidos</span>
                  </Link>
                  <Link href="/dashboard/report/motoboys" className="with-icon nav-link collapsed">
                    <FaMotorcycle />
                    <span>Entregadores</span>
                  </Link>
                  <Link
                    href="/dashboard/report/client"
                    className="with-icon nav-link collapsed"
                    onClick={(e) => {
                      verificationStateRouter(e)
                    }}
                  >
                    <FaList />
                    <span>Relatório Clientes</span>
                  </Link>
                </Accordion.Body>
              </Accordion>
            </li>
          </>
        )}
        <li className="nav-item">
          <Link
            href="/dashboard/invoices"
            className={`with-icon nav-link collapsed ${invoicePending?.invoice !== null ? `pulse-${invoiceAlert}` : ''}`}
            onClick={(e) => {
              verificationStateRouter(e)
              window.innerWidth < 1020 && setShowSidebar(false)
            }}
          >
            <FaBarcode />
            <span className="d-flex justify-content-between align-items-center w-100">Faturas</span>
          </Link>
        </li>

        {profile.id && ((profile.address.street && profile.taxDelivery.length > 0) || plansCategory.every((plan) => plan === 'table')) && (
          <li className="nav-item">
            <Accordion id="config-nav" defaultActiveKey="0" flush>
              <Accordion.Header as="a" bsPrefix="with-icon nav-link collapsed" style={{ color: 'white !important' }}>
                <ImCogs />
                <span>Configurações</span>
              </Accordion.Header>
              <Accordion.Body style={{ marginLeft: '1.2rem', color: 'white' }}>
                <Link
                  href="/dashboard/settings"
                  className="with-icon nav-link collapsed"
                  onClick={(e) => {
                    verificationStateRouter(e)
                    window.innerWidth < 1020 && setShowSidebar(false)
                  }}
                >
                  <BsGear />
                  <span>Gerais</span>
                </Link>
                {plansCategory.includes('package') && (
                  <Link
                    href="/dashboard/settings/package"
                    className="with-icon nav-link collapsed"
                    onClick={(e) => {
                      verificationStateRouter(e)
                      window.innerWidth < 1020 && setShowSidebar(false)
                    }}
                  >
                    {profile.options.package.label2 ? <BsCalendar2Date /> : <GoPackage />}
                    <span>{textPackage(profile.options.package.label2)}</span>
                  </Link>
                )}
                {plansCategory.includes('table') && (
                  <>
                    <Link
                      href="/dashboard/settings/table"
                      className="with-icon nav-link collapsed"
                      onClick={(e) => {
                        verificationStateRouter(e)
                        window.innerWidth < 1020 && setShowSidebar(false)
                      }}
                    >
                      <RiRestaurantLine />
                      <span>Mesas</span>
                    </Link>
                  </>
                )}
                <Link
                  href="/dashboard/settings/cashiers"
                  className="with-icon nav-link collapsed"
                  onClick={(e) => {
                    verificationStateRouter(e)
                    window.innerWidth < 1020 && setShowSidebar(false)
                  }}
                >
                  <FaCashRegister />
                  <span>Caixas</span>
                </Link>
                <Link
                  href="/dashboard/settings/domains"
                  className="with-icon nav-link collapsed"
                  onClick={(e) => {
                    verificationStateRouter(e)
                    window.innerWidth < 1020 && setShowSidebar(false)
                  }}
                >
                  <BsFillCloudyFill />
                  <span>Domínios</span>
                </Link>
                {user?.controls?.paymentInfo?.gateway && (
                  <Link
                    href="/dashboard/settings/payment-details"
                    className="with-icon nav-link collapsed"
                    onClick={(e) => {
                      verificationStateRouter(e)
                      window.innerWidth < 1020 && setShowSidebar(false)
                    }}
                  >
                    <BiDollar />
                    <span>D. de Pagamento</span>
                  </Link>
                )}
              </Accordion.Body>
            </Accordion>
          </li>
        )}
        {/* 
        <li className="nav-item">
          <Link
            className="with-icon nav-link collapsed"
            target="_blank"
            rel="noreferrer"
            href="https://whatsmenu.com.br/videoaulas"
          >
            <BsYoutube fontVariant={"white"} />
            <span>Vídeos de Ajuda</span>
          </Link>
        </li> */}
        {(user?.controls?.type === 'adm' ||
          user?.controls?.type === 'manager' ||
          user?.controls?.type === 'seller' ||
          user?.controls?.type === 'support') && (
            <>
              <li className="nav-heading">Administrador</li>

              {/* <li className="nav-item">
              <Link href="/adm/release-block">
                <Link className="with-icon nav-link collapsed"
                  onClick={e => {
                    verificationStateRouter(e);
                    window.innerWidth < 1020 && setShowSidebar(false);
                  }}>
                  <BsUnlock />
                  <span>Bloq./Desbl.</span>
                </Link>
              </Link>
            </li> */}

              <li className="nav-item">
                <Link
                  href="/adm/products"
                  className="with-icon nav-link collapsed"
                  onClick={(e) => {
                    verificationStateRouter(e)
                  }}
                >
                  <FaFileInvoiceDollar />
                  <span>Produtos</span>
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  href="/adm/client"
                  className="with-icon nav-link collapsed"
                  onClick={(e) => {
                    verificationStateRouter(e)
                  }}
                >
                  <BsPerson />
                  <span>Cliente</span>
                </Link>
              </li>

              <li className="nav-item">
                <Accordion id="relatorioAdm-nav" defaultActiveKey="0" flush>
                  <Accordion.Header as="a" bsPrefix="with-icon nav-link collapsed" style={{ color: 'white !important' }}>
                    <BsClipboardData />
                    <span>Relatórios</span>
                  </Accordion.Header>
                  <Accordion.Body className="p-0" style={{ marginLeft: '1.2rem', color: 'white' }}>
                    <Link
                      href="/adm/report/support"
                      className="with-icon nav-link collapsed"
                      onClick={(e) => {
                        verificationStateRouter(e)
                      }}
                    >
                      <BsBullseye />
                      <span>Bônus Suporte</span>
                    </Link>
                    <Link
                      href="/adm/report/registers"
                      className="with-icon nav-link collapsed"
                      onClick={(e) => {
                        verificationStateRouter(e)
                      }}
                    >
                      <BsFilePerson />
                      <span>Relatório Vendedor</span>
                    </Link>
                    {user?.controls?.type === 'adm' && (
                      <Link
                        href="/adm/report/financial"
                        className="with-icon nav-link collapsed"
                        onClick={(e) => {
                          verificationStateRouter(e)
                        }}
                      >
                        <BsCalendar3 />
                        <span>Relatório Anual</span>
                      </Link>
                    )}
                    <Link
                      href="/adm/report/leads"
                      className="with-icon nav-link collapsed"
                      onClick={(e) => {
                        verificationStateRouter(e)
                      }}
                    >
                      <BsFunnel />
                      <span>Leads</span>
                    </Link>
                  </Accordion.Body>
                </Accordion>
              </li>

              {/* <li className="nav-item">
              <Link href="/adm/report/users/card">
                <Link className="with-icon nav-link collapsed" href="ativos.html"
                  onClick={e => {
                    verificationStateRouter(e);
                  }}>
                  <BsCardText />
                  <span>Ativos Cartão</span>
                </Link>
              </Link>
            </li> */}
            </>
          )}
        <li className="nav-item">
          <Link
            href="/dashboard/updates"
            className="with-icon nav-link collapsed"
            onClick={(e) => {
              verificationStateRouter(e)
            }}
          >
            <BsFillFileEarmarkArrowUpFill />
            <span>Atualizações</span>
            {updates.some((update) => {
              return DateTime.fromISO(update.createdAt).plus({ days: 3 }).toSeconds() >= DateTime.local().toSeconds()
            }) ? (
              <span className="badge bg-danger inline ms-3 pulseElement">Novo</span>
            ) : null}
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/auth/login"
            className="with-icon nav-link collapsed"
            onClick={(e) => {
              verificationStateRouter(e, true)
              e.preventDefault()
            }}
          >
            <BsBoxArrowRight />
            <span>Sair</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/auth/login">
            <Button
              className="with-icon nav-link collapsed border-0 w-100"
              style={{ outline: 0, boxShadow: 'none' }}
              onClick={(e) => {
                setShowNewFeatureModal(true)
              }}
            >
              <MdVideoSettings />
              <span>Videos PDV</span>
            </Button>
          </Link>
        </li>
      </ul>

      <div className="p-3 mb-3 mt-5 rounded-3 bg-primary text-white">
        <Link
          rel="noreferrer"
          href="https://api.whatsapp.com/send/?phone=5511937036875&text=Preciso%20de%20ajuda"
          target="_blank"
          className="link support-message"
        >
          <Image className="img-fluid" src="/images/suporte.png" alt="Suporte WhatsMenu" layout="fill" objectFit="contain" />
        </Link>
        <p className="text-center mt-2 mb-0">De Seg à Sáb das 8h às 20h30.</p>
      </div>
    </>
  )
}
