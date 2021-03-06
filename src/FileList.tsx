import React, { FC, useEffect } from 'react'
import { css, cx } from '@emotion/css'
import { FileOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, NodeIndexOutlined, RotateRightOutlined } from '@ant-design/icons'
import { Pagination, Empty, Dropdown, Menu, Modal, Select, message, Typography } from 'antd'
import { useGetMaterialList, Material, useRemoveMaterial, useGetGroupList, useMoveMaterial } from './lib/hooks'
import { useCtx } from './context'
import { useList, useSetState } from 'react-use'
import { GroupSource } from './GroupList'
import { downloadFile, fileExtension } from './utils'
import { PhotoView, PhotoProvider } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

const fileListPageSize = localStorage.getItem('file_list_page_size')
const pageSize = fileListPageSize ? parseInt(fileListPageSize) : 12

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
      size: pageSize,
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
        size: pageSize,
        groupNo
      })
    }
  }, [groupNo])

  useEffect(() => {
    // 如果当前页没有素材了，就向前翻页
    if (!data) return
    const { records, current } = data
      if (!records.length && current > 1) {
        loadMaterialList({
          current: current - 1,
          size: pageSize,
          groupNo
        })
      }
  }, [data])

  const changePage = (page: number, size: number) => {
    localStorage.setItem('file_list_page_size', String(size))
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
    if (!state.targetGroup) {
      message.warn('未选择目标分组')
      throw new Error('未选择目标分组')
    }
    await moveMaterial({
      fileKeyList: [state.currentMaterial.fileKey],
      materialGroupNo: state.targetGroup
    })
    refreshAsync()
    ctx.refreshGroupList()
    setState({ moveMaterialModalVisible: false, currentMaterial: null })
    message.success('移动成功')
  }

  const renderMenu = (material: Material) => (
    <Menu onClick={(menu) => handleMenuClick(menu, material)}>
      <Menu.Item key="delete" icon={<DeleteOutlined />}>删除</Menu.Item>
      <Menu.Item key="move" icon={<NodeIndexOutlined />}>移动</Menu.Item>
      <Menu.Item key="download" icon={<DownloadOutlined />}>下载</Menu.Item>
      {material.mimeType && material.mimeType.startsWith('image/') && (
        <Menu.Item key="preview" icon={<EyeOutlined />}>
          <PhotoProvider
            maskOpacity={0.5}
            loadingElement={<Typography style={{ color: 'white' }}>加载中...</Typography>}
            brokenElement={<Typography style={{ color: 'white' }}>加载失败</Typography>}
            toolbarRender={({ rotate, onRotate }) => (
              <div className={rotateIconStyle}>
                <RotateRightOutlined className="icon" onClick={() => onRotate(rotate + 90)} />
              </div>
            )}
          >
            <PhotoView src={material.fileUrl}>
              <div style={{ display: 'inline-block' }}>预览</div>
            </PhotoView>
          </PhotoProvider>
        </Menu.Item>
      )}
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
            className={cx({ [fileDisable]: fileSigns.length ? !fileSigns.includes(material.mimeType || '') && !fileSigns.includes(fileExtension(material.fileName)) : false })}
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
                  current={data.current || 1}
                  pageSize={data.size}
                  total={data.total || 1}
                  size="small"
                  onChange={changePage}
                  pageSizeOptions={['8', '12', '16', '20', '24', '28', '36', '80', '120']}
                  showSizeChanger
                />
              )}
            </div>
          </>
        )
        : (
          <div className="empty">
            <Empty description="无素材" />
          </div>
        )
      }
      <Modal
        visible={state.moveMaterialModalVisible}
        title="移动至"
        maskClosable={false}
        okText="确认"
        cancelText="取消"
        onCancel={() => setState({ moveMaterialModalVisible: false })}
        onOk={handleMoveMaterial}
      >
        <Select
          onChange={value => setState({ targetGroup: value })}
          style={{ width: 300 }}
          value={state.targetGroup}
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

const rotateIconStyle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 44,
  userSelect: 'none',
  '.icon': {
    fontSize: 20,
    color: '#b9a1a1',
    transition: 'color .2s linear',
    '&:hover': {
      color: '#fff'
    }
  }
})

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
  },
  '.empty': {
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
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
