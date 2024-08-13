import { Session, User, UserType } from 'next-auth'
import { start } from 'repl'
import { apiRoute } from '../../utils/wm-functions'

type Action = {
  type: 'update'
  payload: Partial<UserType>
  session?: Session
}

const reducerActions = {
  update: (state: Partial<UserType>, action: Action) => {
    return {
      ...state,
      ...action.payload,
    }
  },
}

export const userReducer = (userState: UserType, action: Action) => {
  const fn = reducerActions[action.type]

  if (fn) {
    return fn(userState, action)
  }

  return userState
}
