import { AppContext } from '@context/app.ctx';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image'
import { useContext, useState } from 'react';
import { Button, Card, Form } from "react-bootstrap";
import { useForm } from 'react-hook-form';
import { api } from 'src/lib/axios';

import { z } from 'zod'

const GoogleTagManagerFormSchema = z.object({
  google: z.string().regex(/^GTM-[A-Z0-9]{6,7}$/, 'Id inválido'),
})

type GoogleTagManagerFormType = z.infer<typeof GoogleTagManagerFormSchema>

export default function GoogleTagManager() {
  const { profile, setProfile } = useContext(AppContext)
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<GoogleTagManagerFormType>({
    resolver: zodResolver(GoogleTagManagerFormSchema),
    mode: 'onChange',
    defaultValues: {
      google: profile?.options?.tracking?.google || ''
    }
  })

  const [isInputSelected, setIsInputSelected] = useState(false);

  const handleUpdateGoogleTagManager = async (body: GoogleTagManagerFormType) => {
    try {
      const { data } = await api.post('/dashboard/integrations/google', body)
      setProfile({ ...profile, ...data })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <h1
        className="fw-bold"
        style={{
          color: "#012970"
        }}
      >
        Google Tag Manager
      </h1>
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4>Google Tag Manager</h4>
        </Card.Header>
        <Card.Body>
          <div className='d-flex flex-column gap-3 align-items-center  align-items-md-start flex-md-row mb-5'>
            <div className='d-flex flex-column gap-3'>
              <Image src="/images/google-tag-manager.svg" width={287} height={69} alt='Google Tag Manager' />
              <p>
                O <span className='fw-bold'>Google Tag Manager</span> permite que você acompanhe várias métricas importantes para o seu negócio. Você pode implementar tags de ferramentas de análise, como o Google Analytics, para obter informações detalhadas sobre o tráfego do seu cardápio, comportamento dos clientes, conversões e muito mais.
              </p>
            </div>
            <Image src="/images/tag-manager-report.svg" sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' fill alt='tag-manager-report' className='position-relative' />
          </div>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4>Configurações</h4>
        </Card.Header>
        <Card.Body>
          <Form id='google-tag-manager-form' onSubmit={handleSubmit(handleUpdateGoogleTagManager)}>
            <Form.Label className='d-flex flex-column gap-3 col-12 col-md-4'>
              <span className='fw-bold'>Google Tag Manager</span>
              <div className='position-relative'>
                <Form.Control {...register('google')} onFocus={() => setIsInputSelected(true)} isInvalid={Boolean(errors?.google)} isValid={!Boolean(errors?.google) && isValid} maxLength={10} />
                <Form.Control.Feedback
                  tooltip
                  type="invalid"
                  className="mt-2"
                >
                  {errors?.google?.message}
                </Form.Control.Feedback>
              </div>
              <span>Apenas a identificação</span>
            </Form.Label>
          </Form>
        </Card.Body>
      </Card>
      <div
        className='position-fixed start-0 end-0 p-3 h-auto d-flex justify-content-end'
        style={{
          background: "#DFE6E9",
          transition: "all 0.3s ease",
          bottom: isInputSelected ? "0" : "-68px",
        }}
      >
        <Button
          form='google-tag-manager-form'
          type='submit'
          className='flex-grow-1 flex-md-grow-0'
          variant='success'
          disabled={!isValid}
          style={{
            background: "#13C296",
            border: "none",
          }}
        >
          Salvar
        </Button>
      </div>
    </>

  )
}