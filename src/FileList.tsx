import React, { FC, useEffect } from 'react'
import { css, cx } from '@emotion/css'
import { FileOutlined } from '@ant-design/icons'
import { Pagination, Empty, Dropdown, Menu, Modal, Select, message } from 'antd'
import { useGetMaterialList, Material, useRemoveMaterial, useGetGroupList, useMoveMaterial } from './lib/hooks'
import { useCtx } from './context'
import { useList, useSetState } from 'react-use'
import { GroupSource } from './GroupList'
import { downloadFile, fileExtension } from './utils'

interface Props {
  onClickItem: (item: Material) => void
  groupNo: string,
  selectedKeys: string[],
  accept: string | undefined
}

const ImageList: FC<Props> = ({
  onClickItem,
  groupNo,
  selectedKeys,
  accept
}) => {
  const ctx = useCtx()
  const { data, runAsync: loadMaterialList, refreshAsync } = useGetMaterialList()
  ctx.refreshFileList = refreshAsync
  const [state, setState] = useSetState<{
    currentMaterial: Material | null
    moveMaterialModalVisible: boolean
    targetGroup: string
  }>({
    currentMaterial: null,
    moveMaterialModalVisible: false,
    targetGroup: ''
  })
  const removeMaterial = useRemoveMaterial()
  const moveMaterial = useMoveMaterial()
  const { data: groupListRes, refresh: reloadGroupList } = useGetGroupList()
  const [groups, groupsRef] = useList<GroupSource>([])
  // 如果文件的mimeType或者后缀名出现在这个列表中，那么文件就不可选
  const fileSigns = accept ? accept.split(',').map(sign => sign.trim()) : []

  ctx.searchFile = (filename: string) => {
    loadMaterialList({
      current: 1,
      size: 12,
      groupNo,
      materialName: filename
    })
  }

  useEffect(() => {
    if (groupListRes && groupListRes.code === 10000) {
      groupsRef.set(groupListRes.info.records)
    } 
  }, [groupListRes])

  useEffect(() => {
    if (state.moveMaterialModalVisible) {
      reloadGroupList()
    }
  }, [state.moveMaterialModalVisible])


  useEffect(() => {
    if (groupNo) {
      loadMaterialList({
        current: 1,
        size: 12,
        groupNo
      })
    }
  }, [groupNo])

  const changePage = (page: number, size: number) => {
    loadMaterialList({
      current: page,
      size,
      groupNo
    })
  }

  const handleMenuClick = (menu: any, material: Material) => {
    const { key } = menu
    setState({ currentMaterial: material })
    if (key === 'delete') {
      Modal.confirm({
        title: '删除素材',
        content: `确认删除素材"${material.fileName}"吗？`,
        onOk: async () => removeMaterial([material.fileKey])
          .then(() => {
            refreshAsync()
            ctx.refreshGroupList()
          })
      })
    }
    if (key === 'move') {
      setState({ moveMaterialModalVisible: true })
    }
    if (key === 'download') {
      downloadFile(material.fileUrl, material.fileName)
    }
  }

  const handleMoveMaterial = async () => {
    if (!state.currentMaterial) return
    await moveMaterial({
      fileKeyList: [state.currentMaterial.fileKey],
      materialGroupNo: state.targetGroup
    })
    refreshAsync()
    ctx.refreshGroupList()
    setState({ moveMaterialModalVisible: false, currentMaterial: null, targetGroup: '' })
    message.success('移动成功')
  }

  const renderMenu = (material: Material) => (
    <Menu onClick={(menu) => handleMenuClick(menu, material)}>
      <Menu.Item key="delete">删除</Menu.Item>
      <Menu.Item key="move">移动</Menu.Item>
      <Menu.Item key="download">下载</Menu.Item>
    </Menu>
  )

  const renderList = () => {
    if (data) {
      const list = data.records
      return list.map((material: Material, index: number) => (
        <Dropdown
          overlay={renderMenu(material)}
          trigger={['contextMenu']}
          key={`${material.fileKey}-${index}`}
          className={cx(fileStyle, { 'selected': selectedKeys.includes(material.fileKey) })}
        >
          <div
            className={cx({ [fileDisable]: fileSigns.length ? !fileSigns.includes(material.mimeType) && !fileSigns.includes(fileExtension(material.fileName)) : false })}
            title={material.fileName}
            onClick={() => onClickItem(material)}
          >
            <div className="preview">
              {renderPreview(material)}
            </div>
            <div className="info">
              <span>{material.fileName}</span>
            </div>
          </div>
        </Dropdown>
      ))
    } else {
      return 'loading...'
    }
  }

  const renderPreview = (material: Material) => {
    const { mimeType } = material
    if (!mimeType) {
      return <Material />
    }
    if (mimeType.startsWith('image/')) {
      return <ImagePreview url={material.fileUrl} />
    }
    return <Material />
  }

  return (
    <div className={scrollContainer}>
      {data?.records?.length
        ? (
          <>
            <div className={style}>
              {renderList()}
            </div>
            <div className={paginationStyle}>
              {data && (
                <Pagination
                  current={data.current}
                  pageSize={data.size}
                  total={data.total}
                  size="small"
                  onChange={changePage}
                />
              )}
            </div>
          </>
        )
        : <Empty />
      }
      <Modal
        visible={state.moveMaterialModalVisible}
        title="移动"
        maskClosable={false}
        okText="确认"
        cancelText="取消"
        onCancel={() => setState({ moveMaterialModalVisible: false, targetGroup: '' })}
        onOk={handleMoveMaterial}
      >
        <Select
          onChange={value => setState({ targetGroup: value as string })}
          style={{ width: 300 }}
        >
          {groups.filter(gp => gp.groupNo !== groupNo).map((gp, index: number) => (
            <Select.Option
              key={`${gp.groupNo}-${index}`}
              value={gp.groupNo}
            >
              {gp.groupName}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  )
}

const paginationStyle = css({
  marginTop: 10,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
})

const scrollContainer = css({
  overflowY: 'scroll',
  flexGrow: 1,
  '&::-webkit-scrollbar': {
    width: 0
  }
})

const style = css({
  flexGrow: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gridTemplateRows: 'min-content',
  gap: 10
})

const fileStyle = css({
  height: 160,
  display: 'grid',
  gridTemplateRows: 'auto 2em',
  cursor: 'pointer',
  boxSizing: 'border-box',
  padding: 3,
  '.preview': {
    marginBottom: 6,
    height: '100%'
  },
  '.info': {
    textAlign: 'center',
    color: '#000000d9',
    fontSize: '.9em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    'span': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: '100%'
    }
  },
  '&:hover': {
    padding: 2,
    border: '1px solid #dfdfdfd9'
  },
  '&.selected': {
    padding: 0,
    border: '3px solid green'
  }
})

const fileDisable = css({
  position: 'relative',
  '&:after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#9e9e9e59',
    borderRadius: 3
  }
})

interface PreviewProps {
  url: string
}

const ImagePreview: FC<PreviewProps> = ({ url }) => (
  <div
    className={css({
      height: 'inherit',
      backgroundImage: `url(${url})`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    })}
  />
)

const Material: FC = () => (
  <div
    className={css({
      height: 'inherit',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f7f7f7'
    })}
  >
    <FileOutlined style={{ fontSize: 50, color: '#9f9f9f' }} />
  </div>
)

function debounce(fn: Function, delay: number){
  let timer: number | null = null
  return function() {
      if(timer){
        clearTimeout(timer)
        timer = setTimeout(fn, delay) 
      }else{
        timer = setTimeout(fn, delay)
      }
  }
}

function throttle(fn: Function, delay: number){
  let ready = true
  return function() {
    if(!ready) return
    ready = false
    setTimeout(() => {
      fn()
      ready = true
    }, delay)
  }
}

export default ImageList
