import { createContext } from 'react'

interface AssetsPopupContext {
  onSearch: (value: string) => void
}

export default createContext<AssetsPopupContext>({
  onSearch: () => {}
})
