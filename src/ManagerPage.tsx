import React, { useState, forwardRef } from 'react'
import { css } from '@emotion/css'
import Toolbar from './Toolbar'
import GroupList, { GroupSource } from './GroupList'
import FileList from './FileList'
import Context from './context'
import { RecoilRoot } from 'recoil'

interface Props {
  token: string
}

const ManagerPage = forwardRef<AssetsPopupControll, Props>(({
  token
}, ref) => {
  const [currentGroup, setCurrentGroup] = useState<GroupSource | null>(null)
  const currentGroupNo = currentGroup?.groupNo || ''

  return (
    <Context.Provider
      value={{
        token,
        visible: true,
        refreshFileList: () => {},
        refreshGroupList: () => {},
        searchFile: () => {}
      }}
    >
      <Toolbar group={currentGroup} />
      <div className={mainStyle}>
        <GroupList
          active={currentGroupNo}
          onClickGroup={group => setCurrentGroup(group)}
        />
        <FileList
          accept=""
          groupNo={currentGroupNo}
          onClickItem={() => {}}
          selectedKeys={[]}
        />
      </div>
    </Context.Provider>
  )
})

const mainStyle = css({
  display: 'flex',
  gap: 10
})

export interface AssetsPopupControll {

}

export default function ManagerPageWithRecoil(props: Props) {
  return (
    <RecoilRoot>
      <ManagerPage {...props} />
    </RecoilRoot>
  )
}
