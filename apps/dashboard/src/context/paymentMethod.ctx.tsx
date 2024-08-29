import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState, useEffect } from 'react'
import { AppContext } from './app.ctx'
import Profile, { ProfileFormPayment } from '../types/profile'
import { AxiosResponse } from 'axios'

interface DataResponseType extends AxiosResponse {
  error?: boolean
}
interface PaymentMethodData {
  profileState: Profile | null
  showFinPassModal: boolean | null
  showSpinner: boolean | null
  dataToBeUpdated: any
  dataResponse: DataResponseType | null
  setDataResponse: Dispatch<SetStateAction<DataResponseType | null>>
  setDataToBeUpdated: Dispatch<SetStateAction<any | null>>
  setUpdateDataCallback: Dispatch<SetStateAction<(data: any) => any>>
  updateDataCallback: ((data: any) => any) | undefined
  showResponseAlert: boolean
  setShowResponseAlert: Dispatch<SetStateAction<boolean>>
  handleDataToBeUpdated: (data: any) => void
  handleProfileUpdate: (profile: Profile) => void
  toggleModal: (boolean: boolean) => void
  toggleSpinner: (boolean: boolean) => void
  onSubmit: (data: any, toggleSpinner: any, reset: any) => void
}

interface PaymentMethodProviderProps {
  children: ReactNode
}

export const PaymentMethodContext = createContext<PaymentMethodData>({} as PaymentMethodData)

export const PaymentMethodProvider = ({ children }: PaymentMethodProviderProps) => {
  const { profile, setProfile, handleShowToast } = useContext(AppContext)
  const [showFinPassModal, setShowFinPassModal] = useState(false)
  const [showSpinner, setShowSpinner] = useState(false)
  const [dataToBeUpdated, setDataToBeUpdated] = useState<any>(null)
  const [profileState, setProfileState] = useState(profile)
  const [dataResponse, setDataResponse] = useState<DataResponseType | null>(null)
  const [updateDataCallback, setUpdateDataCallback] = useState<(data: any) => any>()
  const [showResponseAlert, setShowResponseAlert] = useState(false)

  const handleProfileUpdate = (profile: Profile) => {
    setProfileState(profile)
  }

  const handleDataToBeUpdated = (data: any) => {
    setDataToBeUpdated(data)
  }

  const toggleModal = (boolean: boolean) => {
    setShowFinPassModal(boolean)
  }

  const toggleSpinner = (boolean: boolean) => {
    setShowSpinner(boolean)
  }

  const onSubmit = async (data: any, setShowSpinner: Dispatch<SetStateAction<boolean>>, reset: any) => {
    setShowSpinner(true)

    const settings = profile.formsPayment?.find((method) => method.payment === data.payment)
    if (!settings)
      return handleShowToast({
        type: 'erro',
        title: 'Forma de Pagamento',
      })

    if (['credit', 'debit', 'snack', 'food'].includes(settings.payment)) reset()

    const body: ProfileFormPayment = {
      payment: settings?.payment,
      label: settings?.label,
      status: data.status,
      addon: data.addon,
    }

    if ('key' in data) body.key = data.key
    if ('flags' in data) body.flags = data.flags
    if ('newFlag' in data && settings?.flags && data.newFlag && body.flags) body.flags = [...body.flags, { code: '', image: '', name: data.newFlag }]

    if (data.key?.type === 'contact') {
      data.key.value = data.key.value.replace(/\W/g, '')
    }

    setDataToBeUpdated(body)
    setShowSpinner(false)
  }

  useEffect(() => {
    setProfile(profileState)
  }, [profileState, setProfile])

  useEffect(() => {
    setProfileState(profile)
  }, [profile])

  return (
    <PaymentMethodContext.Provider
      value={{
        profileState,
        showFinPassModal,
        showSpinner,
        dataToBeUpdated,
        setDataToBeUpdated,
        toggleModal,
        toggleSpinner,
        handleProfileUpdate,
        handleDataToBeUpdated,
        onSubmit,
        dataResponse,
        setDataResponse,
        setUpdateDataCallback,
        updateDataCallback,
        setShowResponseAlert,
        showResponseAlert
      }}
    >
      {children}
    </PaymentMethodContext.Provider>
  )
}
