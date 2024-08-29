import React, { useContext, useState } from 'react'
import { Card, Form, Button } from 'react-bootstrap'
import { AppContext } from '../../../context/app.ctx'
import { useSession } from 'next-auth/react'
import { apiRoute } from '@utils/wm-functions'

export function AdvanceCard() {
  const { profile, setProfile } = useContext(AppContext)
  const { data: session } = useSession()
  const isMobile = window.innerWidth <= 700

  const updateAdvanceCardPayment = async (value: boolean) => {
    try {
      const { data } = await apiRoute('/dashboard/asaas/updateAdvanceCardPayment', session, 'PUT', { advanceCardPayment: value })
      setProfile({ ...profile, options: { ...profile.options, asaas: { ...profile.options.asaas, advanceCardPayment: value } } })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <div className="d-flex flex-column align-items-center mt-4">
        <h4 className="">Automatize o recebimento das suas cobranças</h4>
      </div>
      <div className={`d-flex justify-content-center mt-4 gap-5 p-4 ${isMobile ? 'flex-column align-items-center' : ''}`}>
        <div className="d-flex flex-column align-items-center gap-3">
          <div className={`text-center rounded p-5 ${!profile.options.asaas.advanceCardPayment ? 'container-asaas-selected' : 'container-asaas'}`}>
            <h1 style={{ fontSize: '2rem' }} className="text-primary">
              2,99%
            </h1>
            <p>32 dias</p>
          </div>
          <Form.Group controlId="AtivarEste1">
            <Form.Check
              className="form-check form-check-inline"
              type="radio"
              id="radio1"
              label="Ativar Este"
              checked={!profile.options.asaas.advanceCardPayment}
              onChange={() => updateAdvanceCardPayment(false)}
            />
          </Form.Group>
        </div>
        <div className="d-flex flex-column align-items-center gap-3">
          <div className={`text-center rounded p-5 ${profile.options.asaas.advanceCardPayment ? 'container-asaas-selected' : 'container-asaas'}`}>
            <h1 style={{ fontSize: '2rem' }} className="text-primary">
              4,99%
            </h1>
            <p>Até 2 dias úteis</p>
          </div>
          <Form.Group controlId="AtivarEste2">
            <Form.Check
              className="form-check form-check-inline"
              type="radio"
              id="radio2"
              label="Ativar Este"
              checked={profile.options.asaas.advanceCardPayment}
              onChange={() => updateAdvanceCardPayment(true)}
            />
          </Form.Group>
        </div>
      </div>
      <div className="d-flex flex-column align-items-center mt-4">
        <p className="text-danger">Obs. acesse o seu app Banco Asaas para extrato detalhado.</p>
      </div>
      <div className="d-flex justify-content-end">
        <Button
          variant="success"
          className="mt-auto flex-fill flex-lg-grow-0"
          onClick={() => updateAdvanceCardPayment(profile.options.asaas.advanceCardPayment)}
        >
          Salvar
        </Button>
      </div>
    </>
  )
}
