import React, { FC, useEffect, useRef } from 'react'
import { Button, Input, Modal, Upload, Form, Switch, Select, Slider, Spin, message, Result } from 'antd'
import { RcFile } from 'antd/lib/upload'
import { useRequest } from 'ahooks'
import { useSetState } from 'react-use'
import { css } from '@emotion/css'
import { useCtx } from './context'
import { GroupSource } from './GroupList'
import { useAxiosInstance } from './lib/api'
import { useGetQiNiuToken, useAddMaterial, useDownloadFile, Material } from './lib/hooks'
import { md5, fileExtension } from './utils'
import imageCompression from 'browser-image-compression'
const qiniu = require('qiniu-js')
import { message as antdMessage } from 'antd'
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { globalConfig, popupVisibleAtom, useLocalFileAtom, multipleAtom, acceptAtom } from './store'

const { Item } = Form

interface Props {
  group: GroupSource | null
}

const Toolbar: FC<Props> = ({ group }) => {
  const ctx = useCtx()
  const [state, setState] = useSetState({
    localUploadModalVisible: false,
    useLocalFileUploading: false
  })
  const [localUploadState, setLocalUploadState] = useSetState({
    uploading: false,
    message: ''
  })
  const qiniuToken = useGetQiNiuToken()
  const addMaterial = useAddMaterial()
  const config = useRecoilValue(globalConfig)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const popupVisible = useRecoilValue(popupVisibleAtom)
  const axios = useAxiosInstance()
  const multiple = useRecoilValue(multipleAtom)
  const accept = useRecoilValue(acceptAtom)
  const setUseLocalFileAtom = useSetRecoilState(useLocalFileAtom)

  const uploadFile = async (file: File) => {
    const fileHash = await md5(file)
    const fileUploadHash = await md5(fileHash + Math.random() + Date.now())
    return new Promise((resolve, reject) => {
      const filename = `${config.prefix}/${fileUploadHash}${fileExtension(file.name)}`
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

  // ??????????????????
  const handleLocalUpload = async (data: LocalUploadFormData) => {
    setLocalUploadState({ uploading: true })
    const { enabled, config } = data
    // ?????????????????????
    for (const file of data.files) {
      if (file.name.length > 60) {
        message.error('???????????????????????????60??????')
        setLocalUploadState({ uploading: false })
        return
      }
    }
    // ??????
    const compressionRatio = config.ratio
    if (enabled === 0 && compressionRatio) {                // ???????????????0??????????????????????????????
      setLocalUploadState({ message: '??????????????????' })
      data.files = await Promise.all(data.files.map(async file => {
        if (['image/png', 'image/jpeg'].includes(file.type)) {
          return await compressImage(file, compressionRatio)
        }
        return file
      }))
    }
    await sleep(500)
    // ??????????????????
    setLocalUploadState({ message: '????????????' })
    const uploadResults: any[] = []
    for (const file of data.files) {
      setLocalUploadState({ message: `????????????"${file.name}"` })
      uploadResults.push({
        file,
        res: await uploadFile(file)
      })
    }
    await sleep(500)
    // ????????????
    setLocalUploadState({ message: '??????????????????????????????' })
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
      message.success('????????????')
      ctx.refreshFileList()
      ctx.refreshGroupList()
      setState({ localUploadModalVisible: false })
    } else {
      message.error(res.msg)
    }
    setLocalUploadState({ uploading: false })
  }

  // ????????????????????????
  const handleUseLocalFile = async (files: File[]) => {
    setState({ useLocalFileUploading: true })
    // ?????????????????????
    for (const file of files) {
      if (file.name.length > 60) {
        message.error('???????????????????????????60??????')
        return
      }
    }
    const uploadResults: any[] = []
    for (const file of files) {
      uploadResults.push({
        file,
        res: await uploadFile(file)
      })
    }
    // ????????????url
    const getMaterialAccessUrlResponse = await axios.post('/authority/material/getMaterialAccessUrl', uploadResults.map(item => item.res.key))
    if (getMaterialAccessUrlResponse.data.code !== 10000) {
      throw new Error('????????????url??????')
    }
    const { materialAccessList } = getMaterialAccessUrlResponse.data.info
    const materials: Material[] = uploadResults.map(item => {
      return {
        fileKey: item.res.key,
        fileName: item.file.name,
        fileUrl: (materialAccessList as { fileKey: string, fileUrl: string }[]).find(material => material.fileKey === item.res.key)?.fileUrl || '',
        materialGroupNo: group?.groupNo || '',
        mimeType: item.file.type,
      }
    })
    setState({ useLocalFileUploading: false })
    setUseLocalFileAtom(materials)
  }

  return (
    <div className={style}>
      <Button type="primary" onClick={() => setState({ localUploadModalVisible: true })}>
        ????????????
      </Button>
      {popupVisible && (
        <Button
          title="?????????????????????????????????????????????????????????"
          style={{ marginLeft: 10 }}
          type="primary"
          onClick={() => inputRef.current?.click()}
          loading={state.useLocalFileUploading}
        >
          ????????????????????????
        </Button> 
      )}
      <input
        type="file"
        style={{ display: 'none' }} 
        ref={inputRef}
        multiple={multiple}
        accept={accept}
        onChange={event => handleUseLocalFile(Array.prototype.slice.call(event.target.files || []))}
      />
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
        placeholder="??????????????????"
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
  enabled: 0 | 1
  config: {
    ratio?: number
  },
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
  const config = useRecoilValue(globalConfig)

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        enabled: config.enabled ? 1 : 0,
        config: config.config,
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
          antdMessage.warn('?????????????????????')
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
        label="??????"
        name="files"
      >
        <LocalFileInput />
      </Item>

      <Item
        label="????????????"
        name="materialType"
        hidden
      >
        <Select>
          <Select.Option value={0}>??????</Select.Option>
          <Select.Option value={1}>??????</Select.Option>
          <Select.Option value={2}>????????????</Select.Option>
        </Select>
      </Item>

      <Item
        label="???????????????????????????"
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
            label="??????????????????"
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
      title={`???????????????"${group ? group.groupName : '????????????'}"`}
      visible={visible}
      onCancel={onCancel}
      maskClosable={false}
      onOk={handleSubmit}
      okText="??????"
      cancelText="??????"
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
      return message.warn('???????????????')
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
          message.error(`??? ${task.link} ????????????`)
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
        <Button type="primary">??????????????????</Button>
        <Button style={{ marginLeft: 10 }} type="primary" onClick={handleClickLink}>??????</Button>
      </Upload>
      <Modal
        title="??????"
        visible={state.linkModalVisible}
        maskClosable={false}
        okText={state.linkSourceDownloading ? '????????????' : '??????'}
        cancelText="??????"
        onCancel={() => setState({ linkModalVisible: false })}
        onOk={handleAddFileFromLinks}
        okButtonProps={{ loading: state.linkSourceDownloading }}
      >
        <Input.TextArea
          rows={10}
          placeholder="???????????????????????????"
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
