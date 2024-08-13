import { DateTime } from 'luxon'
import { GetServerSideProps } from 'next'
import { User, UserType } from 'next-auth'
import { getSession, useSession } from 'next-auth/react'
import { useContext, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Dropdown,
  DropdownButton,
  Form,
  FormControl,
  InputGroup,
  Pagination,
  Row,
  Table,
} from 'react-bootstrap'
import { BsSearch } from 'react-icons/bs'
import { FaCopy } from 'react-icons/fa'
import { ClientConfig } from '../../../components/Administrator/ClientConfig'
import { Title } from '../../../components/Partials/title'
import { AppContext } from '../../../context/app.ctx'
import { Plan, SystemProduct } from '../../../types/plan'
import {
  apiRoute,
  handleCopy,
  normalizeCaracter,
} from '../../../utils/wm-functions'

interface AdmClientProps {
  users: {
    data: UserType[]
    lastPage: number
    page: number
    perPage: number
    total: number
  }
  plans: Plan[]
  systemProducts: SystemProduct[]
}
export default function AdmClient({ plans, ...props }: AdmClientProps) {
  const { data: session } = useSession()
  const { handleShowToast } = useContext(AppContext)
  const [clientSelected, setClientSelected] = useState<boolean | null>()
  const [user, setUser] = useState(props.users.data[0])
  const [users, setUsers] = useState(props.users)
  const [showPagination, setShowPagination] = useState(true)
  const [onlyCard, setOnlyCard] = useState(false)
  const [search, setSearch] = useState({
    user: '',
    type: 'email',
  })
  const handlePaginate = async (page: number) => {
    const { data } = await apiRoute(`/adm/users/${page}`, session)
    setUsers(data.users)
  }

  const [searchValue, setSearchValue] = useState<string>('')
  const [usedFilter, setUsedFilter] = useState<{ name: string; value: string }>(
    { name: 'Todos', value: 'all' }
  )

  const handleGetUser = async () => {
    setClientSelected(false)
    try {
      const { data } = await apiRoute('/adm/user', session, 'POST', search)
      if (data.error) {
        throw data.error
      }
      if (search.type !== 'name') {
        const newUser = data.user
        newUser.profile = data.profile
        setUser(newUser)
        setClientSelected(true)
        setShowPagination(true)
      } else {
        setClientSelected(false)
        setShowPagination(false)
        setUsers({ ...users, data: data.user })
      }
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        type: 'erro',
        content:
          (error as any).response.status === 404
            ? 'Cliente não encontrado.'
            : '',
      })
    }
  }

  const $TableClients = (
    <Row>
      <Col>
        <Table
          responsive
          striped
          bordered
          hover
          className="fs-6 text-nowrap align-middle"
        >
          <thead>
            <tr className="fs-7">
              <th>ID</th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>WhatsApp</th>
              <th>Slug</th>
              <th>Suporte</th>
              <th>Vendedor</th>
              <th>Data de Criação</th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((user) => {
              const created_at = DateTime.fromSQL(user.created_at).toFormat(
                'dd-MM-yyyy HH:mm:ss'
              )
              if (onlyCard && !user.controls?.disableInvoice) {
                return null
              }

              if (searchValue.trim() !== '') {
                switch (usedFilter.value) {
                  case 'all':
                    const valuesArr = [
                      user.id,
                      user.name,
                      user.email,
                      user.whatsapp
                        .replace(/[^\w\s]/gi, '')
                        .split(' ')
                        .join(''),
                      user.profile?.slug,
                      user.support?.name,
                      user.seller?.name,
                      created_at,
                    ].filter((el) => el)
                    if (
                      !valuesArr.some((text) =>
                        normalizeCaracter(String(text)).includes(
                          normalizeCaracter(searchValue)
                        )
                      )
                    ) {
                      return
                    }
                    break
                  case 'seller':
                  case 'support':
                    if (
                      !normalizeCaracter(
                        user[usedFilter.value]?.name || ''
                      ).includes(normalizeCaracter(searchValue))
                    ) {
                      return
                    }
                    break
                  case 'date':
                    if (
                      !normalizeCaracter(created_at).includes(
                        normalizeCaracter(searchValue)
                      )
                    ) {
                      return
                    }
                    break
                  case 'slug':
                    if (
                      !normalizeCaracter(user.profile?.slug || '').includes(
                        normalizeCaracter(searchValue)
                      )
                    ) {
                      return
                    }
                    break
                  case 'whatsapp':
                    const wpp = user.whatsapp
                      .replace(/[^\w\s]/gi, '')
                      .split(' ')
                      .join('')
                    if (
                      !normalizeCaracter(wpp).includes(
                        normalizeCaracter(searchValue)
                      )
                    ) {
                      return
                    }

                    break
                  default:
                    if (
                      !normalizeCaracter(
                        user[usedFilter.value as string]
                      ).includes(normalizeCaracter(searchValue))
                    ) {
                      return
                    }
                    break
                }
              }

              return (
                <tr
                  key={user.id}
                  onClick={() => {
                    setUser(user)
                    setClientSelected(true)
                  }}
                >
                  <td className="fs-8">{user.id}</td>
                  <td className="fs-8">{user.name}</td>
                  <td
                    className="fs-8 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(e, handleShowToast)
                    }}
                  >
                    <FaCopy color="#e2e2e2" /> {user.email}
                  </td>
                  <td
                    className="fs-8 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(e, handleShowToast)
                    }}
                  >
                    <FaCopy color="#e2e2e2" />{' '}
                    {user.whatsapp
                      .replace(/[^\w\s]/gi, '')
                      .split(' ')
                      .join('')}
                  </td>
                  <td
                    className="fs-8 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(e, handleShowToast)
                    }}
                  >
                    <FaCopy color="#e2e2e2" /> {user.profile?.slug || '-'}
                  </td>
                  <td className="fs-8">{user.support?.name || '-'}</td>
                  <td className="fs-8">{user.seller?.name || '-'}</td>
                  <td className="fs-8">{created_at}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Col>
    </Row>
  )
  return (
    <>
      <Title
        title="ADM"
        componentTitle="Gestão de Clientes"
        className="mb-4"
        child={['Cliente']}
      />
      <section>
        <Row>
          <Card>
            <Card.Body>
              <Row
                as="form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleGetUser()
                }}
              >
                <Col sm="6">
                  <Form.Group>
                    <Form.Label className="fs-7">Usuário</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={`Digite o ${(search.type === 'name' ? 'nome' : search.type).toLocaleLowerCase()} ${search.type === 'slug' ? 'do perfil ' : ''}do usuário`}
                      value={search.user}
                      onChange={(e) =>
                        setSearch({ ...search, user: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col sm="4">
                  <Form.Group>
                    <Form.Label className="fs-7 mt-md-0 mt-2">
                      Buscar por
                    </Form.Label>
                    <Form.Select
                      value={search.type}
                      onChange={(e) =>
                        setSearch({ ...search, type: e.target.value })
                      }
                    >
                      <option value="email">Email</option>
                      <option value="slug">Slug</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="name">Nome</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col sm="2" className="mt-md-0 d-flex align-items-end mt-2">
                  <Button
                    variant="success"
                    className="w-100"
                    onClick={handleGetUser}
                  >
                    <span>Buscar</span>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Row>
        <Row className="mt-3">
          <Card>
            {!clientSelected && (
              <Card.Header>
                <Row>
                  {showPagination ? (
                    <>
                      <Col md>
                        <span>
                          Mostrando{' '}
                          {onlyCard
                            ? users.data.filter(
                                (d: any) => d.controls.disableInvoice
                              )?.length
                            : users.data?.length}{' '}
                          de {users.total}
                        </span>
                      </Col>
                      <Col md>
                        <Pagination className="justify-content-center">
                          {users.page > 1 && (
                            <>
                              <Pagination.First
                                onClick={() => handlePaginate(1)}
                              />
                              <Pagination.Prev
                                onClick={() => handlePaginate(users.page - 1)}
                              />
                              <Pagination.Ellipsis disabled />
                            </>
                          )}
                          <Pagination.Item active>{users.page}</Pagination.Item>
                          {users.page !== users.lastPage && (
                            <>
                              <Pagination.Ellipsis disabled />
                              <Pagination.Next
                                onClick={() => handlePaginate(users.page + 1)}
                              />
                              <Pagination.Last
                                onClick={() => handlePaginate(users.lastPage)}
                              />
                            </>
                          )}
                        </Pagination>
                      </Col>
                      <Col md className="text-end">
                        <span>
                          Página {users.page} de {users.lastPage}
                        </span>
                      </Col>
                    </>
                  ) : (
                    <span>
                      {users.data?.length}{' '}
                      {users.data?.length > 1
                        ? 'usuários encontrados'
                        : 'usuário encontrado'}
                    </span>
                  )}
                </Row>
                <Row className="align-items-center">
                  <Col>
                    <Form.Switch
                      id="Somente no Cartão"
                      label="Somente no Cartão"
                      className="m-0"
                      onChange={(e) => setOnlyCard(e.target.checked)}
                      checked={onlyCard}
                    />
                  </Col>
                  <Col sm="12" md="5" className="d-flex align-items-end gap-2">
                    <InputGroup className="flex-grow-1 flex-column flex-md-row gap-md-0 flex-md-nowrap justify-content-md-end mt-1 gap-2">
                      <div className="d-flex flex-grow-1">
                        <InputGroup.Text
                          style={{
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          }}
                        >
                          <BsSearch />
                        </InputGroup.Text>
                        <FormControl
                          aria-label="Pesquisar"
                          placeholder="Pesquisar nesta página..."
                          className="menu-profile-search-input w-100 h-100"
                          style={{ borderRadius: 0 }}
                          onChange={(e) => {
                            setTimeout(() => {
                              setSearchValue(e.target.value.trim())
                            }, 10)
                          }}
                        />
                      </div>
                      <DropdownButton
                        variant="primary"
                        title={usedFilter.name}
                        id="input-group-dropdown-4"
                        align="end"
                        className="d-md-block"
                        // style={{display: window.innerWidth < 380 ? "block" : "inline-block"}}
                      >
                        {[
                          { name: 'Todos', value: 'all' },
                          { name: 'Id', value: 'id' },
                          { name: 'Nome', value: 'name' },
                          { name: 'Email', value: 'email' },
                          { name: 'Whatsapp', value: 'whatsapp' },
                          { name: 'Slug', value: 'slug' },
                          { name: 'Suporte', value: 'support' },
                          { name: 'Vendedor', value: 'seller' },
                          { name: 'Data', value: 'date' },
                        ].map((mapFilter) => (
                          <Dropdown.Item
                            key={mapFilter.value}
                            href="#"
                            onClick={(e: any) => {
                              setUsedFilter(mapFilter)
                            }}
                            className="fs-8 py-2"
                          >
                            {mapFilter.name}
                          </Dropdown.Item>
                        ))}
                      </DropdownButton>
                    </InputGroup>
                  </Col>
                </Row>
              </Card.Header>
            )}
            <Card.Body>
              {clientSelected ? (
                <ClientConfig
                  user={user}
                  plans={plans}
                  returnList={() => setClientSelected(null)}
                  systemProducts={props.systemProducts}
                />
              ) : (
                $TableClients
              )}
            </Card.Body>
          </Card>
        </Row>
      </section>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  let data = {}
  try {
    const { data: usersData } = await apiRoute('/adm/users/1', session)
    data = usersData
  } catch (error) {
    console.error(error)
    return {
      props: {},
      redirect: {
        destination: '/dashboard/request',
      },
    }
  }
  const { data: systemProducts } = await apiRoute(
    '/api/v2/systemProducts',
    session
  )

  return {
    props: { ...data, systemProducts },
  }
}
