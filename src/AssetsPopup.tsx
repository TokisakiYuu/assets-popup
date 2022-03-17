import React, { FC, useEffect, useState, forwardRef } from 'react'
import { Modal } from 'antd'
import { useList } from 'react-use'
import { css } from '@emotion/css'
import Toolbar from './toolbar'
import GroupList, { GroupSource } from './GroupList'
import FileList, { FileSource } from './FileList'
import Context from './context'


const files: FileSource[] = [
  {
    key: '1',
    mediaType: 'image',
    url: 'https://picsum.photos/300/300',
    filename: '张三.png'
  },
  {
    key: '2',
    mediaType: 'image',
    url: 'https://picsum.photos/300/300',
    filename: '王麻子.png'
  },
  {
    key: '3',
    mediaType: 'image',
    url: 'https://picsum.photos/300/300',
    filename: '李四.jpg'
  },
  {
    key: '4',
    mediaType: 'image',
    url: 'https://picsum.photos/200/300',
    filename: '👌拿捏.jpeg'
  },
  {
    key: '5',
    mediaType: 'image',
    url: 'https://picsum.photos/200/300',
    filename: '👊稳住.webp'
  },
  {
    key: '6',
    mediaType: 'image',
    url: 'https://picsum.photos/200/300',
    filename: '🙏能行.png'
  },
  {
    key: '7',
    mediaType: 'video',
    url: 'https://user-images.githubusercontent.com/75239216/158075194-192797bd-f7b1-4da4-adcc-d5fe766316fd.mp4',
    filename: 'video_example.mp4'
  },
  {
    key: '8',
    mediaType: 'video',
    url: 'https://user-images.githubusercontent.com/75239216/158075194-192797bd-f7b1-4da4-adcc-d5fe766316fd.mp4',
    filename: 'video_example.mp4'
  },
  {
    key: '9',
    mediaType: 'video',
    url: 'https://user-images.githubusercontent.com/75239216/158075194-192797bd-f7b1-4da4-adcc-d5fe766316fd.mp4',
    filename: 'video_example.mp4'
  },
  {
    key: '10',
    mediaType: 'video',
    url: 'https://user-images.githubusercontent.com/75239216/158075194-192797bd-f7b1-4da4-adcc-d5fe766316fd.mp4',
    filename: 'video_example.mp4'
  }
]

const groups: GroupSource[] = [
  { id: '1', name: '默认分组', count: 123 },
  { id: '2', name: 'logo', count: 23 },
  { id: '3', name: '资料', count: 22 },
  { id: '4', name: '单据', count: 2 }
]

interface Props {
  visible: boolean
  onClose: () => Promise<boolean | void>
}

const AssetsPopup = forwardRef<AssetsPopupControll, Props>(({
  visible,
  onClose
}, ref) => {
  const [fileDataSource, fileDataSourceRef] = useList<FileSource>([])
  const [selectedItems, selectedItemsRef] = useList<FileSource>([])
  const [currentGroupId, setCurrentGroupId] = useState<string>('1')

  useEffect(() => {
    // 打开时的处理
    fileDataSourceRef.set(files)
    return () => {
      // 关闭时的处理
      selectedItemsRef.clear()
    }
  }, [visible])

  const onSearch = (value: string) => {
    console.log('搜索', value)
  }

  return (
    <Context.Provider value={{ onSearch }}>
      <Modal
        title="素材箱"
        visible={visible}
        onCancel={onClose}
        width={800}
        style={{ top: 20 }}
        okButtonProps={{ disabled: selectedItems.length < 1 }}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
      >
        <Toolbar />
        <div className={mainStyle}>
          <GroupList
            active={currentGroupId}
            dataSource={groups}
            onClickGroup={group => setCurrentGroupId(group.id)}
          />
          <FileList
            dataSource={fileDataSource}
            onClickItem={item => {
              if (selectedItems.includes(item)) {
                // 取消选中
                selectedItemsRef.filter(selectedItem => selectedItem !== item)
              } else {
                // 选中
                selectedItemsRef.push(item)
              }
            }}
            selectedKeys={selectedItems.map(item => item.key)}
          />
        </div>
      </Modal>
    </Context.Provider>
  )
})

const mainStyle = css({
  display: 'flex',
  height: 500,
  gap: 10
})

export interface AssetsPopupControll {

}

export default AssetsPopup
