import React, { FC, useContext, useEffect, useState } from 'react'
import { Button, Input, Modal, Upload, Form, Dropdown, Menu, Switch, Select, Slider } from 'antd'
import { RcFile } from 'antd/lib/upload'
import { CloudUploadOutlined, UploadOutlined, DownOutlined } from '@ant-design/icons'
import { useList, useSetState } from 'react-use'
import { css } from '@emotion/css'
import Context from './context'

const { Item } = Form

const Toolbar: FC = () => {
  const { onSearch } = useContext(Context)
  const [state, setState] = useSetState({
    localUploadModalVisible: false,
    internetUploadModalVisible: false
  })

  const handleMenuClick = (event: any) => {
    switch(event.key) {
      case 'local':
        return setState({ localUploadModalVisible: true })
      case 'internet':
        return setState({ internetUploadModalVisible: true })
    }
  }

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="local" icon={<UploadOutlined />}>
        本地上传
      </Menu.Item>
      <Menu.Item key="internet" icon={<CloudUploadOutlined />}>
        网络链接
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={style}>
      <div className="left">
        <Dropdown overlay={menu}>
          <Button type="primary" onClick={() => setState({ localUploadModalVisible: true })}>
            上传文件 <DownOutlined />
          </Button>
        </Dropdown>
      </div>
      <div className="right">
        <Input.Search placeholder="搜索文件" allowClear onSearch={onSearch} style={{ width: 200 }} />
      </div>
      <LocalUploadModal
        visible={state.localUploadModalVisible}
        onCancel={() => setState({ localUploadModalVisible: false })}
        onFinish={() => {
          console.log('上传完了');
          // TODO 刷新列表
        }}
      />
      <InternetUploadModal
        visible={state.internetUploadModalVisible}
        onCancel={() => setState({ internetUploadModalVisible: false })}
        onFinish={() => {
          console.log('上传完了');
          // TODO 刷新列表
        }}
      />
    </div>
  )
}

interface UploadModalProps {
  visible: boolean
  onCancel: () => void
  onFinish: () => void
}

const LocalUploadModal: FC<UploadModalProps> = ({
  visible,
  onCancel,
  onFinish
}) => {
  const [fileList, fileListRef] = useList<RcFile>([])
  const [form] = Form.useForm()

  useEffect(() => {
    return () => {
      if (!visible) {
        form.resetFields()
      }
    }
  }, [visible])

  return (
    <Modal
      title="本地文件上传"
      visible={visible}
      onCancel={onCancel}
      maskClosable={false}
      onOk={onFinish}
      okText="确认"
      cancelText="取消"
    >
      <Form
        form={form}
        wrapperCol={{ span: 17 }}
        labelCol={{ span: 7 }}
        initialValues={{
          enableImageCompress: false,
          compressionRatio: 60
        }}
      >
        <Item name="locationFile">
          <Upload
            listType="picture"
            beforeUpload={file => {
              fileListRef.push(file)
              return false
            }}
            onRemove={file => fileListRef.filter(item => item !== file)}
            fileList={fileList}
          >
            <Button type="primary">选择本地文件</Button>
          </Upload>
        </Item>

        <Item
          label="为图片文件启用压缩"
          name="enableImageCompress"
          valuePropName="checked"
        >
          <Switch />
        </Item>

        <Item
          noStyle
          shouldUpdate
        >
          {form => form.getFieldValue('enableImageCompress') && (
            <Item
              label="压缩至原图的"
              name="compressionRatio"
            >
              <Slider
                tipFormatter={value => `${value}%`}
                max={100}
                min={10}
              />
            </Item>
          )}
        </Item>
      </Form>
    </Modal>
  )
}

const InternetUploadModal: FC<UploadModalProps> = ({
  visible,
  onCancel,
  onFinish
}) => {
  return (
    <Modal
      title="网络文件上传"
      visible={visible}
      onCancel={onCancel}
      maskClosable={false}
      onOk={onFinish}
      okText="确认"
      cancelText="取消"
    >
      <Form>
        <Item label="链接" name="locationFile">
          <Input />
        </Item>
      </Form>
    </Modal>
  )
}

const style = css({
  marginBottom: 10,
  display: 'flex',
  '.right': {
    marginLeft: 'auto'
  }
})

export default Toolbar
