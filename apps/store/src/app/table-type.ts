import { CommandType } from 'src/app/command-type'
import { FeeType } from './fee-type'
import { TableOpened } from 'src/classes/table'
import Command from '../classes/command'

export interface TableType {
  id: number
  name: string
  profileId: number
  status: boolean
  tableOpenedId?: number
  newTable?: boolean
  opened?: TableOpened
  fees: FeeType[]
  deleted_at: string | null
  command: Command[]
}
