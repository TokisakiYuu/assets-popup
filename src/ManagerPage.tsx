import React, { useState, forwardRef, useEffect } from 'react'
import { css } from '@emotion/css'
import { useRequest } from 'ahooks'
import Toolbar from './Toolbar'
import GroupList, { GroupSource } from './GroupList'
import FileList from './FileList'
import Context from './context'
import { useAxiosInstance } from './lib/api'
import { RecoilRoot, useSetRecoilState } from 'recoil'
import { globalConfig } from './store'

interface Props {
  token: string
}

const ManagerPage = forwardRef<AssetsPopupControll, Props>(({
  token
}, ref) => {
  const [currentGroup, setCurrentGroup] = useState<GroupSource | null>(null)
  const currentGroupNo = currentGroup?.groupNo || ''

  const setConfig = useSetRecoilState(globalConfig)
  const axios = useAxiosInstance()
  const { run: loadConfig } = useRequest(() => 
    axios.get(
      '/authority/material/getCompressionConfig',
      { headers: { sdnxRequestId: token } }
    ).then(res => {
      if (res.data.code === 10000) {
        setConfig(res.data.info)
        return res.data.info
      }
      throw new Error(res.data.msg)
    }),
    { manual: true }
  )

  useEffect(() => {
    loadConfig()
  }, [])

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
