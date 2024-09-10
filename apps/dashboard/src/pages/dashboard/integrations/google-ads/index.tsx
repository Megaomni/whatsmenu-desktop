import { Title } from '@components/Partials/title';
import { AppContext } from '@context/app.ctx';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image'
import { useContext, useState } from 'react';
import { Button, Card, Form } from "react-bootstrap";
import { useForm } from 'react-hook-form';
import { api } from 'src/lib/axios';

import { z } from 'zod'

const GoogleAdsFormSchema = z.object({
  googleAds: z.object({
    id: z.string().regex(/^AW-\d{10}$/, 'Id inválido'),
    label: z.string(),
  })
})

type GoogleAdsFormType = z.infer<typeof GoogleAdsFormSchema>

export default function GoogleAds() {
  const { profile, setProfile } = useContext(AppContext)
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<GoogleAdsFormType>({
    resolver: zodResolver(GoogleAdsFormSchema),
    mode: 'onChange',
    defaultValues: {
      googleAds: profile?.options?.tracking?.googleAds || {
        id: '',
        label: '',
      }
    }
  })

  const [isInputSelected, setIsInputSelected] = useState(false);

  const handleUpdateGoogleAds = async (body: GoogleAdsFormType) => {
    try {
      const { data } = await api.post('/dashboard/integrations/google', body)
      setProfile({ ...profile, ...data })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Title
        title={'Integrações'}
        componentTitle={'Google AdWords'}
        className="mb-4"
        child={['Google AdWords']}
      />
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4>Google AdWords</h4>
        </Card.Header>
        <Card.Body>
          <div className='d-flex flex-column gap-3 align-items-center align-items-md-start flex-md-row mb-5'>
            <div className='d-flex flex-column gap-3 justify-content-between flex-grow-1'>
              <Image src="/images/google-ads.svg" width={303} height={60} alt='Google Ads' className='mb-auto' />
              <p>
                O <span className='fw-bold'>Google Ads</span> (antigo Google Adwords) é a plataforma de anúncios do Google, além de ser a maior ferramenta de links patrocinados da internet. A cobrança pelos anúncios é feita de acordo com os cliques (CPC) e permite criar anúncios de Pesquisa, de Display, no YouTube, no Gmail e na Play Store.
              </p>
            </div>
            <Image src="/images/google-ads-bg.svg" sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' fill alt='tag-manager-report' className='position-relative' />
          </div>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4>Configurações</h4>
        </Card.Header>
        <Card.Body>
          <Form id='google-tag-manager-form' onSubmit={handleSubmit(handleUpdateGoogleAds)} className='d-flex flex-column gap-3'>
            <Form.Label className='d-flex flex-column gap-3 col-12 col-md-4'>
              <span className='fw-bold'>ID</span>
              <div className='position-relative'>
                <Form.Control {...register('googleAds.id')} onFocus={() => setIsInputSelected(true)} isInvalid={Boolean(errors?.googleAds?.id)} isValid={!Boolean(errors?.googleAds?.id) && isValid} maxLength={13} />
                <Form.Control.Feedback
                  tooltip
                  type="invalid"
                  className="mt-2"
                >
                  {errors?.googleAds?.id?.message}
                </Form.Control.Feedback>
              </div>


            </Form.Label>
            <Form.Label className='d-flex flex-column gap-3 col-12 col-md-4'>
              <span className='fw-bold'>Rótulo</span>
              <div className='position-relative'>
                <Form.Control {...register('googleAds.label')} onFocus={() => setIsInputSelected(true)} />
                <Form.Control.Feedback
                  tooltip
                  type="invalid"
                  className="mt-2"
                >
                  {errors?.googleAds?.label?.message}
                </Form.Control.Feedback>
              </div>
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
        >
          Salvar
        </Button>
      </div>
    </>

  )
}