import { createContext, useContext } from 'react'
import { createGlobalState } from 'react-use'

interface AssetsPopupContext {
  token: string
  visible: boolean,
  refreshFileList: Function,
  refreshGroupList: Function,
  searchFile: Function
}

const Context = createContext<AssetsPopupContext>({
  token: '',
  visible: false,
  refreshFileList: () => {},
  refreshGroupList: () => {},
  searchFile: () => {}
})

export function useCtx() {
  return useContext(Context)
}

export default Context
