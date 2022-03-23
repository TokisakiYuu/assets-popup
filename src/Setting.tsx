import React, { FC } from 'react'
import SettingsPage from './SettingsPage'
import Context from './context'

interface Props {
  token: string
}

const Setting: FC<Props> = ({ token }) => {
  return (
    <Context.Provider
      value={{
        token,
        visible: false,
        refreshFileList: () => {},
        refreshGroupList: () => {},
        searchFile: () => {}
      }}
    >
      <SettingsPage token={token} />
    </Context.Provider>
  )
}

export default Setting
