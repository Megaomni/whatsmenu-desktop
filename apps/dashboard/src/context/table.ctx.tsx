import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react'
import { AppContext } from './app.ctx'
import { ConfirmModal } from '../components/Modals/Confirm'
import Command, { CommandType } from '../types/command'
import Table, { TableOpened, TableType } from '../types/table'
import { apiRoute } from '../utils/wm-functions'
import { useSession } from 'next-auth/react'
import { OverlaySpinner } from '../components/OverlaySpinner'
import useLocalStorage from '../hooks/useLocalStorage'
import { tablesReducer, TablesState } from '../reducers/tables/reducer'
import {
  setCurrentCommandIdAction,
  setCurrentTableIdAction,
  setTablesAction,
  switchTablesAction,
  updateCommandAction,
  updateTableAction,
} from '../reducers/tables/actions'

interface TablesContextData {
  tables: Table[]
  tablesFetched: boolean
  table?: Table
  command?: Command
  commandInfo: boolean
  setCommandInfo: Dispatch<SetStateAction<boolean>>
  haveFees: boolean
  handleTableModal: (
    show: boolean,
    modal: 'fees' | 'formsPayment' | 'switchCommands' | 'confirm' | 'print',
    typeModal?: 'command' | 'table'
  ) => void
  setTables: (tables: Table[]) => void
  setCurrentTableId: (tableId: number) => void
  handleCloseTable: () => void
  updateTable: (table: TableType) => void
  updateTableBeforeClose: () => Promise<Table | undefined>

  setCurrentCommandId: (commandId: number) => void
  updateCommand: (command: CommandType) => void
  handleCloseCommand(commandClose: Command | null): Promise<CommandType | void>
  changeCommands: (switchTable: Partial<Table>, commandsIds: number[]) => void
}

export interface ICommandsFees {
  id: number
  feeQuantity?: number
  feeCode: string
  feeAutomatic: boolean
}

interface TablesProviderProps {
  children: ReactNode
}

export const TableContext = createContext<TablesContextData>(
  {} as TablesContextData
)

export function TablesProvider({ children }: TablesProviderProps) {
  const { data: session } = useSession()
  const {
    profile,
    handleShowToast,
    setRequestsToPrint,
    plansCategory,
    socketCommands,
    setSocketCommands,
    finishCommand,
    onOnlineCallback,
    user,
    currency,
  } = useContext(AppContext)
  const [tablesState, dispatch] = useReducer(tablesReducer, {
    tables: [],
    activeTableId: 0,
    activeCommandId: 0,
    command: null,
  } as TablesState)
  const [tablesFetched, setTablesFetched] = useState(false)

  const { tables, activeTableId, activeCommandId } = tablesState

  const table = tables.find((t) => t.id === activeTableId)
  let command = table?.activeCommands().find((c) => c.id === activeCommandId)

  const [commandInfo, setCommandInfo] = useState(false)

  const [defaultDomain, setDefaultDomain] = useLocalStorage<string | null>(
    'defaultDomain',
    null,
    'sessionStorage'
  )

  // MODALS
  const [typeModal, setTypeModal] = useState<'command' | 'table'>('command')
  const [showTableModal, setShowTableModal] = useState({
    fees: false,
    formsPayment: false,
    switchCommands: false,
    confirm: false,
    print: false,
  })
  const [showSpinner, setShowSpinner] = useState(false)

  // TABLES
  const setCurrentTableId = (tableId: number) => {
    dispatch(setCurrentTableIdAction(tableId))
  }

  const setTables = (tables: Table[]) => {
    dispatch(setTablesAction(tables))
  }

  const updateTable = (table: TableType) => {
    dispatch(updateTableAction(table))
  }

  const handleCloseTable = async () => {
    await updateTableBeforeClose()
    if (table) {
      if (table.haveCarts()) {
        handleTableModal(true, 'fees', 'table')
      } else {
        try {
          const { data } = await apiRoute(
            `/dashboard/table/closeAllTableCommands`,
            session,
            'PATCH',
            {
              id: table.id,
              tableId: table.opened?.id,
              fees: table.opened?.fees,
              formsPayment: [],
            }
          )
          if (table.opened) {
            table.opened.commands.forEach((c) => (c.status = false))
            table.opened.status = false
            table.status = data.status
            // setTable((state) => ({ ...state, status: true, opened: undefined } as Table));
            dispatch(
              updateTableAction({
                ...table,
                status: data.status,
                opened: undefined,
              })
            )
          }
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  const updateTableBeforeClose = async () => {
    if (table) {
      setCommandInfo(false)
      setShowSpinner(true)
      try {
        const { data }: { data: TableType } = await apiRoute(
          `/dashboard/getTable/${table.id}`,
          session
        )
        updateTable({ ...data })
        return new Table(data)
      } catch (error) {
        console.error(error)
      } finally {
        setShowSpinner(false)
      }
    }
  }

  const handleTableModal = useCallback(
    (
      show: boolean,
      modal: 'fees' | 'formsPayment' | 'switchCommands' | 'confirm' | 'print',
      typeModal?: 'command' | 'table'
    ) => {
      if (typeModal) {
        setTypeModal(typeModal)
      }
      setTimeout(() => {
        setShowTableModal({ ...showTableModal, [modal]: show })
      }, 1)
    },
    [showTableModal]
  )
  // COMMANDS

  const setCurrentCommandId = (commandId: number) => {
    dispatch(setCurrentCommandIdAction(commandId))
  }

  const updateCommand = (command: CommandType) => {
    dispatch(updateCommandAction(command))
  }

  const changeCommands = async (
    switchTable: Partial<Table>,
    commandsIds: number[]
  ) => {
    const body = {
      oldTableId: table?.opened?.id,
      newTableId: switchTable?.id,
      commandsIds,
    }

    if (!commandsIds.length) {
      return handleShowToast({
        type: 'alert',
        title: 'Troca de Comandas',
        content: 'Selecione uma comanda para mudar de mesa.',
      })
    }
    try {
      const { data } = await apiRoute(
        '/dashboard/command/changeTable',
        session,
        'PATCH',
        body
      )

      if (switchTable.id) {
        dispatch(
          switchTablesAction(
            switchTable.id,
            data.oldTableOpened,
            data.newTableOpened
          )
        )
      }

      // const newTable = tables.find((t) => t.id === switchTable?.id);
      // if (table) {
      //   const currentTable = tables.find(t => t.id === table.id)
      //   if (currentTable) {
      //     currentTable.opened = new TableOpened(data.oldTableOpened)
      //     setCurrentTableId(currentTable.id)
      //   }
      // }
      // if (newTable) {
      //   newTable.opened = new TableOpened(data.newTableOpened);
      // }
      handleShowToast({
        type: 'success',
        title: 'Troca de Mesa',
        content: '',
      })
    } catch (error) {
      handleShowToast({ type: 'erro', title: 'Troca de Comandas' })
      console.error(error)
    }
  }

  const handleCloseCommand = async (currentCommand: Command) => {
    if (currentCommand && table) {
      if (currentCommand.haveCarts() && !currentCommand.fullPaid()) {
        updateTableBeforeClose()
        handleTableModal(true, 'fees', 'command')
      } else {
        try {
          const { data }: { data: CommandType } = await apiRoute(
            `/dashboard/commandChangeStatus/${currentCommand.id}`,
            session,
            'PATCH',
            {
              fees: currentCommand.fees,
              formsPayment: currentCommand.formsPayment,
              tableId: table?.id,
            }
          )

          if (table?.activeCommands()?.length === 0) {
            handleShowToast({
              type: 'success',
              title: 'Mesa Livre',
              content: `Mesa ${table.name} foi encerrada com sucesso, e já está liberada para os próximos clientes.`,
              delay: 5000,
            })
          }
          // updateCommand(data)
        } catch (error) {
          console.error(error)
          return handleShowToast({ type: 'erro' })
        }
      }
    }
  }

  useEffect(() => {
    socketCommands.forEach((commandWs) => {
      const tableWs = tables.find((t) => t?.id === commandWs.tableId)
      if (tableWs) {
        if (
          !tableWs.opened ||
          !(tableWs?.opened?.id === commandWs.tableOpenedId)
        ) {
          tableWs.opened = new TableOpened({
            id: commandWs.tableOpenedId,
            tableId: commandWs.tableId as number,
            fees: commandWs.fees,
            formsPayment: commandWs.formsPayment,
            status: true,
            created_at: commandWs.created_at,
            updated_at: commandWs.updated_at,
            commands: socketCommands.map((c) => new Command(c)),
          })
        } else {
          if (finishCommand === 'command') {
            tableWs.opened.commands = tableWs.opened.commands.filter(
              (c) => c.id !== commandWs.id
            )
          } else if (finishCommand === 'table') {
            tableWs.opened.commands.forEach((c) => (c.status = false))
            tableWs.opened.status = false
          } else {
            tableWs.opened.commands.push(new Command(commandWs))
          }
        }
      }
    })
    if (socketCommands.length) {
      setSocketCommands([])
    }
  }, [socketCommands, tables, finishCommand, setSocketCommands])

  useEffect(() => {
    profile?.fees?.forEach((profileFee) => {
      if (table) {
        table.activeCommands().forEach((activeCommand) => {
          if (activeCommand) {
            const commandFee = activeCommand.fees?.find(
              (f) => f.code === profileFee.code
            )
            if (commandFee) {
              // commandFee.status = profileFee.status;
            } else {
              if (profileFee.status) {
                if (profileFee.type === 'fixed') {
                  activeCommand.fees?.push({
                    ...profileFee,
                    quantity: profileFee.automatic ? 1 : 0,
                  })
                } else {
                  activeCommand.fees?.push({ ...profileFee })
                }
              }
            }
            activeCommand.fees = activeCommand.fees?.filter((f) => f.status)
          }
        })
      }
    })
  }, [command, table, profile?.fees])

  useEffect(() => {
    const getTables = async () => {
      try {
        const { data }: { data: TableType[] } = await apiRoute(
          '/dashboard/tables',
          session
        )
        dispatch(setTablesAction(data))
        setTablesFetched(true)
        if (!defaultDomain) {
          let { data } = await apiRoute('/dashboard/domain', session)
          setDefaultDomain(data || baseUrl)
        }
      } catch (error) {
        console.error(error)
      }
    }
    // if (table) {
    //   const haveTable = tables.find(t => t.id === table.id)
    //   if (haveTable) {
    //     setTable(state => {
    //       if (!state || (state.opened?.id !== haveTable.opened?.id)) {
    //         return { ...haveTable }
    //       }
    //       return state
    //     })
    //   }
    //   if (table.activeCommands().length) {
    //     setCommand(state => {
    //       if (!state) {
    //         return table.activeCommands()[0]
    //       }
    //       return { ...state }
    //     })
    //   }
    // }
    getTables()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  window.ononline = async () => {
    onOnlineCallback()
    if (plansCategory.includes('table')) {
      const { data } = await apiRoute('/dashboard/tables', session)
      const updatedTables = data.map((table: TableType) => new Table(table))
      setTables([...updatedTables])
      if (table) {
        const updatedTable = updatedTables.find(
          (t: TableType) => t.id === table.id
        )
        if (updatedTable) {
          updateTable(updatedTable)
        }
      }
    }
  }

  useEffect(() => {
    setCommandInfo(false)
  }, [activeTableId])

  const baseUrl = process.env.NEXT_PUBLIC_WHATSMENU_BASE_URL
  const haveFees = !!(
    profile?.fees?.filter((f) => f.status).length ||
    (typeModal === 'command'
      ? command?.fees.length
      : table?.opened && table?.opened.getUpdatedFees(false, true).length)
  )

  return (
    <TableContext.Provider
      value={{
        tables,
        setTables,
        table,
        setCurrentTableId,
        command,
        setCurrentCommandId,
        commandInfo,
        setCommandInfo,
        haveFees,
        handleTableModal,
        handleCloseCommand,
        handleCloseTable,
        changeCommands,
        updateTableBeforeClose,
        tablesFetched,
        updateTable,
        updateCommand,
      }}
    >
      {children}
      <section className="modals">
        <ConfirmModal
          show={showTableModal.confirm}
          onHide={() => {
            setShowTableModal({ ...showTableModal, confirm: false })
            if (command?.fullPaid() && typeModal === 'command') {
              handleCloseCommand(command)
            }
          }}
          confirmButton={`${!command?.fullPaid() && typeModal === 'command' ? 'OK' : 'Sim'}`}
          cancelButton={`${!command?.fullPaid() && typeModal === 'command' ? 'none' : 'Não'}`}
          title="Impressão"
          message={`${!command?.fullPaid() && typeModal === 'command'
              ? `Esta comanda ainda possui um valor de: ${currency({
                value: command?.getTotalValue('lack') || 0,
              })} em aberto, a comanda ${command?.name ?? ''} não será encerrada até que o valor faltante seja pago.`
              : `Deseja realizar a impressão da ${typeModal === 'command' ? 'comanda' : 'mesa'} ?`
            }`}
          actionConfirm={() => {
            if (typeModal === 'command' && command && command.fullPaid()) {
              setRequestsToPrint({
                type: 'command',
                carts: [], // possivel alterações
                command,
                table,
                directPrint: true,
                show: true,
                onFinished: () => {
                  if (table) {
                    setTimeout(() => {
                      updateTable({
                        ...table,
                        opened: table.activeCommands().length
                          ? ({ ...table.opened } as TableOpened)
                          : undefined,
                      })
                    }, 100)
                  }
                },
              })
            }
            if (typeModal === 'table' && table) {
              setRequestsToPrint({
                type: 'table', // possivel alterações
                carts: [],
                table,
                opened: table.opened,
                command: command || null,
                directPrint: true,
                report: true,
                show: true,
                onFinished: () => {
                  setTimeout(() => {
                    updateTable({
                      ...table,
                      opened: table.activeCommands().length
                        ? ({ ...table.opened } as TableOpened)
                        : undefined,
                    })
                  }, 100)
                },
              })
            }

            setShowTableModal({
              ...showTableModal,
              formsPayment: false,
            })
          }}
          actionCancel={() => {
            if (table) {
              updateTable({
                ...table,
                opened: table.activeCommands().length
                  ? ({ ...table.opened } as TableOpened)
                  : undefined,
              })
            }
          }}
        />
        <OverlaySpinner
          show={showSpinner}
          width={150}
          weight={10}
          textSpinner="Atualizando Mesa..."
          className="fs-4"
          position="fixed"
        />
      </section>
    </TableContext.Provider>
  )
}
