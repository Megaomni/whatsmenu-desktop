import { HelpVideos } from '@components/Modals/HelpVideos'
import { OverlaySpinner } from '@components/OverlaySpinner'
import { Title } from '@components/Partials/title'
import { AppContext } from '@context/app.ctx'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWhatsAppBot } from '@hooks/useWhatsAppBot'
import { handleCopy } from '@utils/wm-functions'
import Link from 'next/link'
import { useContext, useState } from 'react'
import { Button, Card, Form, Modal } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { FaRegCopy } from 'react-icons/fa'
import { api } from 'src/lib/axios'
import { z } from 'zod'

const IfoodCodeSchema = z.object({
  code: z.string().min(9),
})

type IfoodIntegration = {
  userCode: string
  verificationUrl: string
}

type IfoodCode = z.infer<typeof IfoodCodeSchema>

export default function SettingsIfood() {
  const { profile, handleShowToast, setProfile } = useContext(AppContext)
  const { openLink } = useWhatsAppBot()
  const [ifoodIntegration, setIfoodIntegration] = useState<IfoodIntegration | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [merchants, setMerchants] = useState<any[]>([])
  const [merchantSelected, setMerchantSelected] = useState<any>(null)
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<IfoodCode>({
    resolver: zodResolver(IfoodCodeSchema),
  })
  const handleGetUserCode = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get(`dashboard/ifood/userCode`)
      setIfoodIntegration(data)
    } catch (error) {
      console.log('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmIfoodAuth = async ({ code }: IfoodCode) => {
    try {
      const { data } = await api.post(`dashboard/ifood/token`, { wmId: profile.id, code })
      setMerchants(data.merchants)
    } catch (error) {
      console.log('error')
      handleShowToast({ type: 'erro', title: 'Autenticação Ifood', content: 'Não foi possível confirmar o token da Ifood' })
    }
  }

  const handleCreateDateIfoodIntegration = async (merchantId: string) => {
    try {
      let merchant
      const { data } = await api.post(`dashboard/ifood/merchantId`, { merchantId })
      const integrations = data.integrations
      merchant = document.querySelector('input[name="merchant"]:checked')?.getAttribute('value')

      setMerchants((state) => state.filter((merchant) => merchant.id === merchantId))
      setIfoodIntegration(null)
      setProfile({ ...profile, options: { ...profile.options, integrations: { ...profile.options.integrations, ...integrations } } })

    } catch (error) {
      console.error('Erro ao integrar loja IFood no painel:', error)
    }
  }

  return (
    <>
      <Title title="Configurações" className="mb-4" componentTitle="Integração Ifood" child={['Ifood']} />
      <Card>
        <Card.Header className="d-flex justify-content-between">
          <h3>Integração de Pedidos iFood</h3>
          <HelpVideos.Trigger className="btn btn-danger p-1 text-nowrap m-auto me-0" textStyle="text-white" urls={[]} />
        </Card.Header>
        <Card.Body>
          <div>
            {ifoodIntegration ? (
              <form onSubmit={handleSubmit(handleConfirmIfoodAuth)}>
                <div className="border rounded-3 p-3 d-flex flex-column gap-3 text-center">
                  <div
                    className="d-flex align-items-center justify-content-center gap-2 fs-3 m-0 cursor-pointer"
                    onClick={() => handleCopy(ifoodIntegration.userCode, handleShowToast)}
                  >
                    <span className="text-danger">{ifoodIntegration.userCode}</span>
                    <FaRegCopy style={{ color: 'var(--bs-gray-500)' }} />
                  </div>
                  <Link href={ifoodIntegration.verificationUrl} target="_blank" onClick={openLink}>
                    {ifoodIntegration.verificationUrl}
                  </Link>
                  <p className="fw-semibold m-0">Clique no link acima para pegar o Código de Autorização iFood.</p>
                </div>
                <div className="d-flex flex-column align-items-center mt-3">
                  <Form.Label>
                    <span>Código de autorização iFood:</span>
                    <Form.Control placeholder="XXXX-XXXX" className="text-center mt-3" {...register('code')} />
                  </Form.Label>
                  <Button className="mt-3 px-5 py-2" type="submit" disabled={!isValid}>
                    {!isValid ? 'Insira o código' : 'Confirmar'}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <p className="mb-5" style={{ color: 'var(--bs-gray-600)' }}>
                  Integração para ter todos os pedidos iFood integrados em nossa plataforma, facilitando o recebimento e gestão do seu
                  estabelecimento.
                </p>
                {profile.options.integrations?.ifood || merchants[0] ? (
                  <>
                    <b className="fs-4">Loja Integrada</b>
                    <p>{merchants[0]?.name}</p>
                  </>
                ) : (
                  <Button className="px-3 py-2" onClick={() => handleGetUserCode()}>
                    <span>Integrar com iFood</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </Card.Body>
        <OverlaySpinner show={isLoading} backgroundColor="#fff" />
      </Card>
      <Modal show={merchants.length > 1} centered>
        <Modal.Header>
          <h3>Escolha de Loja</h3>
        </Modal.Header>
        <Modal.Body>
          <p style={{ color: 'var(--bs-gray-600)' }}>
            Atenção, foi detectado que você possui mais de uma loja, escolha abaixo qual loja você quer para recebimento de pedidos.
          </p>

          <div className="d-flex flex-column gap-2 p-2">
            {merchants.map((merchant) => (
              <Form.Label key={merchant.id} className="d-flex align-items-center gap-2 border p-3">
                <Form.Check type="radio" name="merchant" value={merchant.id} id={merchant.id} onChange={e => setMerchantSelected(merchant.id)} />
                <span>{merchant.name}</span>

              </Form.Label>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            className="px-3 py-2"
            onClick={() => handleCreateDateIfoodIntegration(merchantSelected)}
          >
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
