import React, {
  Dispatch,
  FormHTMLAttributes,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ButtonProps, Button, Spinner } from 'react-bootstrap'
import Cart from '../../types/cart'
import { AppContext } from '../../context/app.ctx'
import { DateTime } from 'luxon'
import { useSession } from 'next-auth/react'
import { ProfileOptions } from '../../types/profile'
import { encodeTextURL } from '../../utils/wm-functions'
import useLocalStorage from '../../hooks/useLocalStorage'
import { CartsContext } from '../../context/cart.ctx'
import { useWhatsAppBot } from '@hooks/useWhatsAppBot'
import i18n from 'i18n'

type SendStatusMessageFormProps = {
  button: { name: string; props?: ButtonProps }
  cart: Cart
  newStatus?: null | 'production' | 'transport' | 'canceled'
  profileOptions?: ProfileOptions
} & FormHTMLAttributes<HTMLFormElement>

export const SendStatusMessageForm = ({
  button,
  cart,
  newStatus,
  profileOptions,
  ...rest
}: SendStatusMessageFormProps) => {
  const { data: session } = useSession()
  const {
    door,
    lastRequestDate,
    profile,
    handleShowToast,
    setRequestsToPackage,
    requestsToPackage,
    possibleMobile,
  } = useContext(AppContext)
  const { setCarts, carts, setCart } = useContext(CartsContext)

  const [message, setMessage] = useState(
    (profileOptions ?? profile.options).placeholders.clientText
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [closeTabs, setCloseTabs] = useLocalStorage(
    '@wmstatus:closeTabs',
    localStorage.getItem('@wmstatus:closeTabs') ?? false
  )

  const { sendMessage, onMessageSend } = useWhatsAppBot()

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleSendMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (buttonRef.current) {
      let phoneMessage = message
      buttonRef.current.disabled = true

      const sendToWhatsApp = () => {
        if (buttonRef.current) {
          const { linkWhatsapp, whatsappOficial } =
            profileOptions ?? profile.options
          const isWindows = navigator.userAgent.includes('Windows')

          if (
            whatsappOficial ||
            possibleMobile ||
            (linkWhatsapp && !isWindows)
          ) {
            window.open(
              `whatsapp://send?phone=55${cart.client.whatsapp}&text=${encodeTextURL(
                cart.client.name,
                phoneMessage.replaceAll('[NOME]', cart.client.name)
              )}`
            )
            buttonRef.current.disabled = false
            return
          }

          if (!('isElectron' in window)) {
            window.open(
              `https://web.whatsapp.com/send?phone=55${cart.client.whatsapp}&text=${encodeTextURL(cart.client.name, phoneMessage)}`
            )
            buttonRef.current.disabled = false
            return
          }

          if ('isElectron' in window) {
            const contact = cart.client?.controls?.whatsapp?.contactId
              ? cart.client?.controls?.whatsapp?.contactId.user
              : `${i18n.t('ddi')}${cart.client.whatsapp}`
            sendMessage(
              contact,
              phoneMessage.replaceAll('[NOME]', cart.client.name),
              cart.client
            )
            onMessageSend((client: any) => {
              cart.client = client
              setCart(cart)
            })
            return
          }
        }
      }

      if (newStatus || newStatus === null) {
        const waitMillis = localStorage.getItem('waitMillis')
          ? Number(localStorage.getItem('waitMillis'))
          : 5000
        const oldStatus = cart.status

        if (newStatus !== null) {
          switch (newStatus) {
            case 'production':
              phoneMessage =
                (profileOptions ?? profile.options).placeholders
                  .statusProduction ??
                (cart.type === 'P'
                  ? cart.defaultStatusProductionPackage
                  : cart.defaultStatusProductionMessage)
              setMessage(
                (profileOptions ?? profile.options).placeholders
                  .statusProduction ??
                  (cart.type === 'P'
                    ? cart.defaultStatusProductionPackage
                    : cart.defaultStatusProductionMessage)
              )
              break
            case 'transport':
              if (cart.address) {
                phoneMessage =
                  (profileOptions ?? profile.options).placeholders.statusSend ||
                  cart.defaultStatusTransportMessage
                setMessage(
                  (profileOptions ?? profile.options).placeholders.statusSend ||
                    cart.defaultStatusTransportMessage
                )
              } else {
                phoneMessage =
                  (profileOptions ?? profile.options).placeholders
                    .statusToRemove || cart.defaultStatusToRemoveMessage
                setMessage(
                  (profileOptions ?? profile.options).placeholders
                    .statusToRemove || cart.defaultStatusToRemoveMessage
                )
              }
              break
            case 'canceled':
              phoneMessage = cart.defaultCanceledMessage
              setMessage(cart.defaultCanceledMessage)
              break
            default:
              phoneMessage = (profileOptions ?? profile.options).placeholders
                .clientText
              setMessage(
                (profileOptions ?? profile.options).placeholders.clientText
              )
              break
          }
        }

        if (cart.print || profile.options.print.app || cart.type === 'P') {
          if (
            door &&
            DateTime.local().toMillis() - lastRequestDate > waitMillis
          ) {
            try {
              setLoading && setLoading(true)
              await cart.updateStatus(newStatus, session)
              if (cart.type === 'P') {
                setRequestsToPackage({ ...requestsToPackage })
              } else {
                // setCartsAction(state => [...state]);
              }
              if (cart.type !== 'T' && newStatus) {
                if (oldStatus !== cart.status && oldStatus !== 'canceled') {
                  sendToWhatsApp()
                }
              }
            } catch (error) {
              throw error
            } finally {
              buttonRef.current.disabled = false
              setLoading && setLoading(false)
              setCarts([...carts])
            }
          } else {
            handleShowToast({
              show: true,
              title: i18n.t('please_wait_n'),
              content: i18n.t('order_printed_please_wait_finish'),
            })
          }
        }
      } else {
        if (cart.type !== 'T' && newStatus !== null) {
          sendToWhatsApp()
        }
      }
    }
  }

  return (
    // <form style={{ display: 'contents' }} ref={formRef} action="https://api2.whatsmenu.com.br/api/v2/request/status/send" method="POST" target="_blank" onSubmit={(e) => { e.preventDefault() }} {...rest}>
    //   <input type="hidden" name="whatsapp" value={`55${request.contact}`} />
    //   <input type="hidden" name="app" value={(profileOptions ?? profile.options).linkWhatsapp ? 1 : 0} />
    //   <input type="hidden" name="message" value={encodeTextURL(request.name, message)} />
    <Button ref={buttonRef} {...button.props} onClick={handleSendMessage}>
      {loading ? (
        <>
          <Spinner
            size="sm"
            animation="border"
            variant="light"
            className="d-inline-block ms-1"
          />
          <span className="d-inline-block ms-1">{i18n.t('please_wait_n')}</span>
        </>
      ) : (
        button.name
      )}
    </Button>
    // </form>
  )
}
