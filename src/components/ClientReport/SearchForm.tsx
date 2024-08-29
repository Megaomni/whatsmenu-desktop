import { Button, Form, Modal, Table } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext, useState } from 'react'
import { AppContext } from '@context/app.ctx'
import { apiRoute } from '@utils/wm-functions'
import { useSession } from 'next-auth/react'

const SearchFormSchema = z.object({
  type: z.enum(['name', 'whatsapp']),
  search: z.string().min(3).trim(),
}).transform(data => {
  let { type, search } = data
  if (type === 'whatsapp') {
    search = search.replace(/\D+/g, '')
    return { ...data, search }
  }
  return data
})

type SearchFormSchemaInput = z.infer<typeof SearchFormSchema>

interface SearchFormProps {
  client: any
  onSelectClient: (client: any) => void
}

export const SearchForm = ({ onSelectClient, client }: SearchFormProps) => {
  const { data: session } = useSession()
  const { handleShowToast } = useContext(AppContext)
  const { register, handleSubmit, watch, resetField } = useForm<SearchFormSchemaInput>({
    resolver: zodResolver(SearchFormSchema),
  })

  const [clientsFetched, setClientsFetched] = useState<any[]>([])
  const [showClientsModal, setShowClientsModal] = useState(false)

  const handleSearchClients = async (body: SearchFormSchemaInput) => {
    try {
      const { data } = await apiRoute('/dashboard/report/clients/search?notValidate=true', session, 'POST', body)
      const { clients } = data
      switch (type) {
        case 'name':
          if (!clients.length) {
            handleShowToast({ type: 'alert', content: 'Nenhum cliente encontrado com esse nome' })
            break
          }
          if (clients.length > 1) {
            setClientsFetched(clients)
            setShowClientsModal(true)
            break
          }
          onSelectClient(clients[0])
          break
        case 'whatsapp':
          onSelectClient(clients)
          break
      }
    } catch (error) {
      console.error(error)
      handleShowToast({ type: 'erro' })
    }
  }

  const { type } = watch()

  return (
    <>
      <form onSubmit={handleSubmit(handleSearchClients)} className="d-flex flex-column flex-md-row gap-2 m-2">
        <div>
          <Form.Select {...register('type')}>
            <option value="whatsapp">Whatsapp</option>
            <option value="name">Nome</option>
          </Form.Select>
        </div>
        <div>
          <Form.Control 
            placeholder={type === 'whatsapp' ? 'Telefone' : 'Nome'}
            id="search" 
            {...register('search')}
          />
        </div>
        <Button className="my-auto " variant="success" type="submit">
          Buscar
        </Button>
        {client && (
          <Button
            className="my-auto"
            onClick={() => {
              onSelectClient(null)
              resetField('search')
            }}
          >
            Limpar
          </Button>
        )}
      </form>
      <Modal size='lg' scrollable centered show={showClientsModal}>
        <Modal.Header>Clientes Encontrados</Modal.Header>
        <Modal.Body style={{ maxHeight: '80vh' }}>
          <Table striped bordered >
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {clientsFetched.map((c) => (
                <tr
                  role="button"
                  key={c.id}
                  onClick={() => {
                    onSelectClient(c)
                    setShowClientsModal(false)
                  }}
                >
                  <td>{c.name}</td>
                  <td>{c.whatsapp || '-'}</td>
                  <td>{c.email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>
    </>
  )
}
