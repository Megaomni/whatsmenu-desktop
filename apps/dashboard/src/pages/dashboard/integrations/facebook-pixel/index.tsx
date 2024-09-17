import { Title } from '@components/Partials/title';
import { AppContext } from '@context/app.ctx';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image'
import { useContext, useState } from 'react';
import { Button, Card, Form } from "react-bootstrap";
import { useForm } from 'react-hook-form';
import { api } from 'src/lib/axios';

import { z } from 'zod'

const FacebookPixelFormSchema = z.object({
  pixel: z.string().min(15, {
    message: 'O pixel deve ter pelo menos 15 caracteres',
  }),
})

type FacebookPixelFormType = z.infer<typeof FacebookPixelFormSchema>

export default function FacebookPixel() {
  const { profile, setProfile } = useContext(AppContext)
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FacebookPixelFormType>({
    resolver: zodResolver(FacebookPixelFormSchema),
    mode: 'onChange',
    defaultValues: {
      pixel: profile?.options?.tracking?.pixel || ''
    }
  })

  const [isInputSelected, setIsInputSelected] = useState(false);

  const handleUpdateFacebookPixel = async (body: FacebookPixelFormType) => {
    try {
      const { data } = await api.post('/dashboard/integrations/facebookPixel', body)
      setProfile({ ...profile, ...data })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Title
        title={'Integrações'}
        componentTitle={'Facebook Pixel'}
        className="mb-4"
        child={['Facebook Pixel']}
      />
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4>Facebook Pixel</h4>
        </Card.Header>
        <Card.Body>
          <div className='d-flex flex-column gap-3 align-items-center align-items-md-start flex-md-row mb-5'>
            <div className='d-flex flex-column gap-3 h-100'>
              <Image src="/images/facebook-pixel.svg" sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' fill alt='Facebook Pixel' className='mb-auto position-relative' />
              <p>
                O <span className='fw-bold'>Pixel da Meta</span> é um trecho de código colocado no cardápio digital da sua loja que permite medir a eficácia da sua publicidade por meio da compreensão das ações que as pessoas realizam no cardápio.
              </p>
              <p>Você pode usar o Pixel da Meta para:</p>
              <ul
                className='fw-bold'
                style={{
                  listStyleImage: "url('/images/green-check.svg')"
                }}
              >
                <li className='mb-4'>Ter certeza de que os seus anúncios serão mostrados às pessoas certas. Encontre novos clientes ou pessoas que realizaram uma ação desejada no seu cardápio.</li>
                <li className='mb-4'>Gerar mais vendas. alcance pessoas mais propensas a realizar uma compra.</li>
                <li className='mb-4'>Medir os resultados dos seus anúncios. Entenda melhor o impacto dos seus anúncios, mensure o que acontece quando as pessoas os visualizam.</li>
              </ul>
            </div>
            <Image src="/images/marketing-guy-1.svg" sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' fill alt='marketing-guy-1' className='position-relative' />
          </div>
          <p>Depois de configurar o <span className='fw-bold'>Pixel da Meta</span>, ele registrará quando alguém realizar uma ação no seu cardápio. Algumas ações incluem adicionar um item ao carrinho ou realizar uma compra. O pixel recebe essas ações ou eventos, que podem ser visualizados na sua página do Pixel da Meta no Gerenciador de eventos. Você também terá opções de alcançar esses clientes novamente por meio de anúncios futuros e ReMarketing.</p>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4>Configurações</h4>
        </Card.Header>
        <Card.Body>
          <Form id='facebook-pixel-form' onSubmit={handleSubmit(handleUpdateFacebookPixel)}>
            <Form.Label className='d-flex flex-column gap-3 col-12 col-md-4'>
              <span className='fw-bold '>Facebook Pixel</span>
              <div className='position-relative'>
                <Form.Control {...register('pixel')} onFocus={() => setIsInputSelected(true)} isInvalid={Boolean(errors?.pixel)} isValid={!Boolean(errors?.pixel) && isValid}  />
                <Form.Control.Feedback
                  tooltip
                  type="invalid"
                  className="mt-2"
                >
                  {errors?.pixel?.message}
                </Form.Control.Feedback>
              </div>
              <span>Apenas a identificação</span>
            </Form.Label>
          </Form>
        </Card.Body>
        <Card.Footer className='d-flex justify-content-end'>
          <Button
            form='facebook-pixel-form'
            type='submit'
            className='flex-grow-1 flex-md-grow-0'
            variant='success'
            disabled={!isValid}
          >
            Salvar
          </Button>
        </Card.Footer>
      </Card>
    </>

  )
}