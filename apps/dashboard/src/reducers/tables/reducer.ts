import Command from '../../types/command'
import Table, { TableOpened, TableType } from '../../types/table'
import { TablesStateActions } from './actions'

export interface TablesState {
  tables: Table[]
  activeTableId: number
  activeCommandId: number
}

export const tablesReducer = (state: TablesState, action: any): TablesState => {
  switch (action.type) {
    // TABLES
    case TablesStateActions.SET_TABLES: {
      state.tables = action.payload.tables.map((t: TableType) => new Table(t))
      return { ...state }
    }
    case TablesStateActions.SET_CURRENT_TABLE_ID: {
      return {
        ...state,
        activeTableId: action.payload.tableId,
      }
    }

    case TablesStateActions.UPDATE_TABLE: {
      const updateTableIndex = state.tables.findIndex(
        (table) => table.id === action.payload.table.id
      )
      if (updateTableIndex > -1) {
        state.tables[updateTableIndex] = new Table(action.payload.table)
      }
      return {
        ...state,
      }
    }

    case TablesStateActions.SWITCH_TABLE: {
      const switchTableIndex = state.tables.findIndex(
        (table) => table.id === action.payload.switchTableId
      )
      if (switchTableIndex > -1) {
        state.tables[switchTableIndex].opened = new TableOpened(
          action.payload.newTableOpened
        )
      }
      const oldTable = state.tables.find(
        (table) => table.id === state.activeTableId
      )
      if (oldTable) {
        oldTable.opened = new TableOpened(action.payload.oldTableOpened)
      }
    }

    // COMMANDS
    case TablesStateActions.SET_CURRENT_COMMAND_ID: {
      return {
        ...state,
        activeCommandId: action.payload.commandId,
      }
    }

    case TablesStateActions.UPDATE_COMMAND: {
      const table = state.tables.find(
        (t) => t.opened?.id === action.payload.command?.tableOpenedId
      )
      if (table) {
        if (table.opened) {
          const commandIndex = table.opened.commands.findIndex(
            (c) => c.id === action.payload.command?.id
          )
          if (commandIndex > -1) {
            table.opened.commands[commandIndex] = new Command(
              action.payload.command
            )
          }
          if (!table.activeCommands().length) {
            table.opened.status = false
            table.opened = undefined
          }
        }
      }

      return {
        ...state,
      }
    }
    default:
      return state
  }
}
