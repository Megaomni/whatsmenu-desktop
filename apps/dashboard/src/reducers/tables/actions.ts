import { CommandType } from '../../types/command'
import { TableOpenedType, TableType } from '../../types/table'

export enum TablesStateActions {
  SET_TABLES = 'SET_TABLES',
  SET_CURRENT_TABLE_ID = 'SET_CURRENT_TABLE_ID',
  UPDATE_TABLE = 'UPDATE_TABLE',
  SWITCH_TABLE = 'SWITCH_TABLE',
  SET_CURRENT_COMMAND_ID = 'SET_CURRENT_COMMAND_ID',
  UPDATE_COMMAND = 'UPDATE_COMMAND',
}
// TABLES
export const setTablesAction = (tables: TableType[]) => {
  return {
    type: TablesStateActions.SET_TABLES,
    payload: {
      tables,
    },
  }
}

export const setCurrentTableIdAction = (tableId: number) => {
  return {
    type: TablesStateActions.SET_CURRENT_TABLE_ID,
    payload: {
      tableId,
    },
  }
}

export const updateTableAction = (table: TableType) => {
  return {
    type: TablesStateActions.UPDATE_TABLE,
    payload: {
      table,
    },
  }
}

export const switchTablesAction = (
  switchTableId: number,
  oldTableOpened: TableOpenedType,
  newTableOpened: TableOpenedType
) => {
  return {
    type: TablesStateActions.SWITCH_TABLE,
    payload: {
      switchTableId,
      oldTableOpened,
      newTableOpened,
    },
  }
}

// COMMANDS
export const setCurrentCommandIdAction = (commandId: number) => {
  return {
    type: TablesStateActions.SET_CURRENT_COMMAND_ID,
    payload: {
      commandId,
    },
  }
}

export const updateCommandAction = (command: CommandType) => {
  return {
    type: TablesStateActions.UPDATE_COMMAND,
    payload: {
      command,
    },
  }
}
