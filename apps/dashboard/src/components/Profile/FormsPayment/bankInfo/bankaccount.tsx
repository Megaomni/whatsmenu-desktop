import { useContext, useEffect, useState } from 'react'
import { Alert, Card } from 'react-bootstrap'
import { PaymentSettingsProps } from '..'

import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import BankForm from './bankForm'

const BankSettings = ({ paymentMethod }: PaymentSettingsProps) => {
  const { profileState, showResponseAlert } = useContext(PaymentMethodContext)
  const [showPresentation, setShowPresentation] = useState<boolean | null>(true)

  useEffect(() => {
    if (profileState?.options?.asaas) setShowPresentation(false)
  }, [])

  return (
    <div className="d-flex">
      {!profileState?.options?.asaas ? (
        <Card className="position-relative w-100">
          <div>
            <BankForm paymentMethod={paymentMethod} profileState={profileState} showPresentation={showPresentation} />
          </div>
        </Card>
      ) : (
        <>
          {showResponseAlert ? (
            <Card className="d-flex flex-column w-100 p-4">
              <Alert className="text-center">
                Conta na plataforma Asaas criada com sucesso, acesse o email {profileState.options.asaas.loginEmail} para definir uma senha com o
                token enviado para o número de celular {profileState.options.asaas.mobilePhone}
              </Alert>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}

export default BankSettings
