import React, { FC, useEffect } from 'react'
import { css, cx } from '@emotion/css'
import { useGetGroupList, useCreateGroup, useDeleteGroup, useUpdateGroup } from './lib/hooks'
import { useCtx } from './context'
import { Skeleton, Button, Modal, Input, Dropdown, Menu, message } from 'antd'
import { FolderAddTwoTone } from '@ant-design/icons'
import { useSetState } from 'react-use'

interface Props {
  onClickGroup: (group: GroupSource) => void
  active: string
}

export interface GroupSource {
  groupNo: string
  groupName: string,
  materialCount: number
}

const GroupList: FC<Props> = ({
  onClickGroup,
  active
}) => {
  const { data, runAsync: loadGroupList, refresh } = useGetGroupList()
  const { visible } = useCtx()
  const ctx = useCtx()
  ctx.refreshGroupList = refresh
  const [state, setState] = useSetState({
    newGroupModalVisible: false,
    newGroupName: '',
    editingGroup: ''
  })
  const createGroup = useCreateGroup()
  const deleteGroup = useDeleteGroup()
  const updateGroup = useUpdateGroup()

  useEffect(() => {
    if (visible) {
      loadGroupList()
        .then(({ data }) => {
          // 打开素材箱加载完分组列表后选中第一个分组
          if (data.code === 10000 && data?.info.records.length) {
            onClickGroup(data.info.records[0])
          }
        })
    }
  }, [visible])

  const handleCreateGroup = async () => {
    await createGroup({
      groupName: state.newGroupName
    })
    setState({ newGroupModalVisible: false, newGroupName: '' })
    refresh()
  }

  const handleUpdateGroup = async () => {
    await updateGroup({
      groupName: state.newGroupName,
      groupNo: state.editingGroup
    })
    message.success('修改成功')
    setState({ newGroupModalVisible: false, newGroupName: '', editingGroup: '' })
    refresh()
  }

  const handleGroupMenuClick = (item: any, group: any) => {
    const { key } = item
    if (key === 'rename') {
      setState({
        editingGroup: group.groupNo as string,
        newGroupModalVisible: true,
        newGroupName: group.groupName
      })
    }
    if (key === 'delete') {
      Modal.confirm({
        title: '删除分组',
        content: `确定要删除"${group.groupName}"？`,
        onOk: async () => deleteGroup({ groupNo: group.groupNo }).then(refresh)
      })
    }
  }

  const renderMenu = (group: any) => (
    <Menu onClick={(item) => handleGroupMenuClick(item, group)}>
      <Menu.Item key="rename">重命名分组</Menu.Item>
      <Menu.Item key="delete">删除分组</Menu.Item>
    </Menu>
  )

  const renderList = () => {
    if (data && data.code === 10000) {
      return data.info.records.map((group: any) => (
        <Dropdown
          overlay={renderMenu(group)}
          trigger={['contextMenu']}
          key={group.groupNo}
          className={cx(itemStyle, { 'active': group.groupNo === active })}
        >
          <div
            onClick={() => onClickGroup(group)}
          >
            <div className="name">{group.groupName}</div>
            <div className="count">{group.materialCount}</div>
          </div>
        </Dropdown>
      ))
    }
    return Array.from({ length: 3 }, (_, index) => (
      <div key={index} className={itemStyle}>
        <Skeleton active title={false} paragraph={{ rows: 1, width: '100%' }} />
      </div>
    ))
  }

  return (
    <div className={style}>
      {renderList()}
      <div className="create-group">
        <Button
          type="link"
          icon={<FolderAddTwoTone />}
          onClick={() => setState({ newGroupModalVisible: true })}
        >
          新建分组
        </Button>
      </div>
      <Modal
        title={state.editingGroup ? '重命名分组' : '新建分组'}
        maskClosable={false}
        visible={state.newGroupModalVisible}
        okText="确定"
        cancelText="取消"
        onOk={state.editingGroup ? handleUpdateGroup : handleCreateGroup}
        onCancel={() => setState({ newGroupModalVisible: false, newGroupName: '' })}
      >
        <Input
          placeholder="请输入分组名称"
          maxLength={20}
          value={state.newGroupName}
          onChange={event => setState({ newGroupName: event.target.value })}
        />
      </Modal>
    </div>
  )
}

const style = css({
  height: '100%',
  flexBasis: 200,
  flexGrow: 0,
  flexShrink: 0,
  border: '1px solid rgba(0,0,0,.06)',
  display: 'flex',
  flexDirection: 'column',
  '.create-group': {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

const itemStyle = css({
  padding: '10px 16px',
  display: 'flex',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: '#000000d9',
  transition: 'background-color .5s, color .5s',
  '.count': {
    marginLeft: 'auto'
  },
  '&:hover': {
    color: '#1890ff'
  },
  '&.active': {
    backgroundColor: '#e6f7ff',
    color: '#1890ff'
  }
})

export default GroupList
