import React, { FC, useEffect } from 'react'
import { Button, Input, Modal, Upload, Form, Switch, Select, Slider, Spin, message, Result } from 'antd'
import { RcFile } from 'antd/lib/upload'
import { useRequest } from 'ahooks'
import { useSetState } from 'react-use'
import { css } from '@emotion/css'
import { useCtx } from './context'
import { GroupSource } from './GroupList'
import { useAxiosInstance } from './lib/api'
import { useGetQiNiuToken, useAddMaterial, useDownloadFile } from './lib/hooks'
import { md5 } from './utils'
import imageCompression from 'browser-image-compression'
const qiniu = require('qiniu-js')
import { message as antdMessage } from 'antd'
import { atom, useRecoilState, useRecoilValue } from 'recoil'
import { CompressionConfig } from './store'

const { Item } = Form

interface Props {
  group: GroupSource | null
}

const globalConfig = atom<CompressionConfig>({
  key: 'globalConfig',
  default: {
    enabled: false,
    prefix: '',
    config: {}
  }
})

const Toolbar: FC<Props> = ({ group }) => {
  const ctx = useCtx()
  const [state, setState] = useSetState({
    localUploadModalVisible: false
  })
  const [localUploadState, setLocalUploadState] = useSetState({
    uploading: false,
    message: ''
  })
  const qiniuToken = useGetQiNiuToken()
  const addMaterial = useAddMaterial()
  const config = useRecoilValue(globalConfig)

  const uploadFile = async (file: File) => {
    const fileHash = await md5(file)
    const fileUploadHash = await md5(fileHash + Math.random() + Date.now())
    return new Promise((resolve, reject) => {
      const filename = `${config.prefix}/${fileUploadHash}`
      const observable = qiniu.upload(
        file,
        filename,
        qiniuToken,
        { fname: file.name, mimeType: file.type },
        { upprotocol: 'https:' }
      )
      observable.subscribe(
        null,
        reject,
        resolve
      )
    });
  }

  const compressImage = async (file: File, ratio: number) => {
    // https://www.npmjs.com/package/browser-image-compression
    if (!(['image/png', 'image/jpeg'].includes(file.type))) return file
    return await imageCompression(file, {
      maxSizeMB: file.size * (ratio / 100) / 1024 / 1024
    })
  }

  // 本地文件上传
  const handleLocalUpload = async (data: LocalUploadFormData) => {
    setLocalUploadState({ uploading: true })
    const { enableImageCompress, compressionRatio } = data
    // 检查文件名长度
    for (const file of data.files) {
      if (file.name.length > 60) {
        message.error('文件名长度不能超过60个字')
        setLocalUploadState({ uploading: false })
        return
      }
    }
    // 压缩
    if (enableImageCompress && compressionRatio) {
      setLocalUploadState({ message: '正在压缩图片' })
      data.files = await Promise.all(data.files.map(async file => {
        if (['image/png', 'image/jpeg'].includes(file.type)) {
          return await compressImage(file, compressionRatio)
        }
        return file
      }))
    }
    await sleep(500)
    // 上传到七牛云
    setLocalUploadState({ message: '正在上传' })
    const uploadResults: any[] = []
    for (const file of data.files) {
      setLocalUploadState({ message: `正在上传"${file.name}"` })
      uploadResults.push({
        file,
        res: await uploadFile(file)
      })
    }
    await sleep(500)
    // 添加素材
    setLocalUploadState({ message: '正在添加到你的素材库' })
    await sleep(500)
    const res = await addMaterial({
      fileList: uploadResults.map(item => ({
        fileKey: item.res.key,
        fileName: item.file.name
      })),
      materialGroupNo: group?.groupNo,
      materialType: data.materialType
    })
    if (res.code === 10000) {
      message.success('添加成功')
      ctx.refreshFileList()
      ctx.refreshGroupList()
      setState({ localUploadModalVisible: false })
    } else {
      message.error(res.msg)
    }
    setLocalUploadState({ uploading: false })
  }

  return (
    <div className={style}>
      <Button type="primary" onClick={() => setState({ localUploadModalVisible: true })}>
        上传文件
      </Button>
      <LocalUploadModal
        group={group}
        visible={state.localUploadModalVisible}
        onCancel={() => {
          setState({ localUploadModalVisible: false })
          setLocalUploadState({ uploading: false })
        }}
        onFinish={handleLocalUpload}
        uploading={localUploadState.uploading}
        message={localUploadState.message}
      />
      <Input.Search
        placeholder="请输入文件名"
        allowClear
        style={{ marginLeft: 'auto', width: 200 }}
        onSearch={filename => ctx.searchFile(filename)}
        onChange={value => !value && ctx.searchFile(undefined)}
      />
    </div>
  )
}

const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time))
interface UploadModalProps {
  group: GroupSource | null
  visible: boolean
  onCancel: () => void
  onFinish: (data: LocalUploadFormData) => void
  uploading: boolean
  message: string
}

interface LocalUploadFormData {
  files: File[]
  enableImageCompress: boolean
  compressionRatio?: number
  materialType: number
}

const LocalUploadModal: FC<UploadModalProps> = ({
  group,
  visible,
  onCancel,
  onFinish,
  uploading,
  message
}) => {
  const [form] = Form.useForm<LocalUploadFormData>()
  const [config, setConfig] = useRecoilState(globalConfig)
  const axios = useAxiosInstance()
  const { run: loadConfig } = useRequest(() => 
    axios.get(
      '/authority/material/getCompressionConfig'
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
    if (visible) {
      loadConfig()
    }
  }, [visible])

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        ...config,
        materialType: 0
      })
    }
    return () => {
      if (!visible) {
        form.setFieldsValue({
          files: []
        })
      }
    }
  }, [visible, config])

  const handleSubmit = () => {
    form.validateFields()
      .then(data => {
        if (!data.files.length) {
          antdMessage.warn('未选择任何文件')
          return
        }
        onFinish(data)
      })
  }

  const FormNode = (
    <Form
      form={form}
      wrapperCol={{ span: 17 }}
      labelCol={{ span: 7 }}
    >
      <Item
        label="文件"
        name="files"
      >
        <LocalFileInput />
      </Item>

      <Item
        label="素材类型"
        name="materialType"
        hidden
      >
        <Select>
          <Select.Option value={0}>通用</Select.Option>
          <Select.Option value={1}>证件</Select.Option>
          <Select.Option value={2}>交易数据</Select.Option>
        </Select>
      </Item>

      <Item
        label="为图片文件启用压缩"
        name="enabled"
        valuePropName="checked"
        normalize={value => value ? 0 : 1}
        getValueProps={value => ({ checked: value === 0 })}
      >
        <Switch />
      </Item>

      <Item
        noStyle
        shouldUpdate
      >
        {form => (
          <Item
            label="压缩至原图的"
            name={['config', 'ratio']}
          >
            <Slider
              tipFormatter={value => `${value}%`}
              max={100}
              min={10}
              disabled={form.getFieldValue('enabled') === 1}
            />
          </Item>
        )}
      </Item>
    </Form>
  )

  return (
    <Modal
      title={`上传文件到"${group ? group.groupName : '默认分组'}"`}
      visible={visible}
      onCancel={onCancel}
      maskClosable={false}
      onOk={handleSubmit}
      okText="确认"
      cancelText="取消"
      okButtonProps={{ loading: uploading }}
    >
      {uploading
        ? <Spin tip={message}>{FormNode}</Spin>
        : FormNode
      }
    </Modal>
  )
}

interface CustomFormItemProps<V = any> {
  value?: V
  onChange?: (value: V) => void
}

const LocalFileInput: FC<CustomFormItemProps<RcFile[]>> = ({ value = [], onChange }) => {
  if (!value || !onChange) return null
  const [state, setState] = useSetState({
    linkModalVisible: false,
    linkListContent: '',
    linkSourceDownloading: false
  })
  const downloadFile = useDownloadFile()

  const handleClickLink = (e: any) => {
    e.stopPropagation()
    setState({ linkModalVisible: true })
  }

  const downloadSource = async () => {
    const tasks = state.linkListContent
      .split('\n')
      .filter(item => !!item)
      .map(item => ({
        link: item.trim(),
        successed: false
      }))
    if (!tasks.length) {
      return message.warn('未输入链接')
    }
    const files: File[] = []
    setState({ linkSourceDownloading: true })
    for (const task of tasks) {
      try {
        const file = await downloadFile(task.link)
        files.push(file)
        task.successed = true
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error(`从 ${task.link} 下载失败`)
        }
      }
      await sleep(300)
      setState({ linkListContent: tasks.filter(task => !task.successed).map(task => task.link).join('\n') })
    }
    setState({ linkSourceDownloading: false })
    setState({ linkModalVisible: false })
    return files
  }

  const handleAddFileFromLinks = async () => {
    const files = await downloadSource() as unknown as RcFile[]
    const newValue = [...value]
    newValue.push(...files)
    onChange(newValue)
  }

  return (
    <div>
      <Upload
        listType="picture"
        beforeUpload={file => {
          value.push(file)
          onChange(value)
          return false
        }}
        onRemove={file => {
          onChange(value.filter(item => item !== file))
        }}
        fileList={value}
        multiple
      >
        <Button type="primary">选择本地文件</Button>
        <Button style={{ marginLeft: 10 }} type="primary" onClick={handleClickLink}>链接</Button>
      </Upload>
      <Modal
        title="链接"
        visible={state.linkModalVisible}
        maskClosable={false}
        okText={state.linkSourceDownloading ? '正在下载' : '确认'}
        cancelText="取消"
        onCancel={() => setState({ linkModalVisible: false })}
        onOk={handleAddFileFromLinks}
        okButtonProps={{ loading: state.linkSourceDownloading }}
      >
        <Input.TextArea
          rows={10}
          placeholder="多个链接用换行隔开"
          value={state.linkListContent}
          onChange={event => setState({ linkListContent: event.target.value })}
          readOnly={state.linkSourceDownloading}
          style={{ wordBreak: 'break-all' }}
        />
      </Modal>
    </div>
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
