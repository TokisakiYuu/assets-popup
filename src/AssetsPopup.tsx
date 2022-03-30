import React, { FC, useEffect, useState, forwardRef } from 'react'
import { Modal } from 'antd'
import { useList } from 'react-use'
import { css } from '@emotion/css'
import Toolbar from './Toolbar'
import GroupList, { GroupSource } from './GroupList'
import FileList from './FileList'
import Context from './context'
import { Material } from './lib/hooks'
import { fileExtension } from './utils'
import mime from 'mime'
import { RecoilRoot } from 'recoil'

interface Props {
  token: string
  visible: boolean
  onCancel: () => void
  onSelect: (list: Material[]) => void
  /** 默认单选 */
  multiple?: boolean
  accept?: string
}

const AssetsPopup = forwardRef<AssetsPopupControll, Props>(({
  token,
  visible,
  onCancel,
  onSelect,
  multiple,
  accept
}, ref) => {
  const [selectedItems, selectedItemsRef] = useList<Material>([])
  const [currentGroup, setCurrentGroup] = useState<GroupSource | null>(null)
  const currentGroupNo = currentGroup?.groupNo || ''
  // 如果文件的mimeType或者后缀名出现在这个列表中，那么文件就不可选
  const fileSigns = accept ? accept.split(',').map(sign => sign.trim()) : []
  const acceptExtensions: string[] = fileSigns
    .map(sign => sign.startsWith('.') ? sign.substring(1) : mime.getExtension(sign) || '')
    .filter(ext => ext !== null)

  useEffect(() => {
    selectedItemsRef.clear()
  }, [currentGroup])

  return (
    <Context.Provider
      value={{
        token,
        visible,
        refreshFileList: () => {},
        refreshGroupList: () => {},
        searchFile: () => {}
      }}
    >
      <Modal
        title="素材箱"
        visible={visible}
        onCancel={onCancel}
        width={800}
        style={{ top: 20 }}
        okButtonProps={{ disabled: selectedItems.length < 1 }}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
        onOk={() => onSelect(selectedItems)}
      >
        <Toolbar group={currentGroup} />
        <p className={extTipStyle}>当前只能选择{acceptExtensions.join('、')}格式的文件</p>
        <div className={mainStyle}>
          <GroupList
            active={currentGroupNo}
            onClickGroup={group => setCurrentGroup(group)}
          />
          <FileList
            accept={accept}
            groupNo={currentGroupNo}
            onClickItem={item => {
              if (fileSigns.length) {
                if (!fileSigns.includes(item.mimeType || "") && !fileSigns.includes(fileExtension(item.fileName))) return
              }
              if (selectedItems.includes(item)) {
                // 取消选中
                selectedItemsRef.filter(selectedItem => selectedItem !== item)
              } else {
                // 选中
                // 如果是单选，那么只能选一个
                if (!multiple) {
                  selectedItemsRef.set([item])
                } else {
                  selectedItemsRef.push(item)
                }
              }
            }}
            selectedKeys={selectedItems.map(item => item.fileKey)}
          />
        </div>
      </Modal>
    </Context.Provider>
  )
})

const mainStyle = css({
  display: 'flex',
  minHeight: 500,
  gap: 10
})

const extTipStyle = css({
  fontSize: 12,
  color: '#999'
})

export interface AssetsPopupControll {

}

export default function AssetsPopupWithRecoil(props: Props) {
  return (
    <RecoilRoot>
      <AssetsPopup {...props} />
    </RecoilRoot>
  )
}
