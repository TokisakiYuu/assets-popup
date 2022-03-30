import React, { FC, useEffect } from 'react'
import { Form, Switch, Slider, Button, Spin } from 'antd'
import { useAxiosInstance } from './lib/api'
import { useSaveCompressionConfig } from './lib/hooks'
import { RecoilRoot, useSetRecoilState } from 'recoil'
import { compressionConfig, CompressionConfig } from './store'
import { useRequest } from 'ahooks'

const { Item } = Form

interface Props {
  token: string
}

const SettingPage: FC<Props> = () => {
  const [form] = Form.useForm()
  const setConfig = useSetRecoilState(compressionConfig)
  const saveConfig = useSaveCompressionConfig()
  const axios = useAxiosInstance()
  const { loading, error } = useRequest(() => 
    axios.get(
      '/authority/material/getCompressionConfig'
    ).then(res => {
      if (res.data.code === 10000) {
        form.setFieldsValue(res.data.info)
        return res.data.info
      }
      throw new Error(res.data.msg)
    })
  )

  const handleSave = async () => {
    const data = await form.validateFields()
    await saveConfig(data)
    setConfig(data as CompressionConfig)
  }

  if (loading) {
    return <Spin />
  }

  if (error) {
    return <div>{error.message}</div>
  }

  return (
    <div>
      <Form form={form}>
        <Item
          label="是否默认开启压缩"
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
          {() => (
            <Item
              label="默认压缩比例"
              name={['config', 'ratio']}
            >
              <Slider
                style={{ maxWidth: 300 }}
                tipFormatter={value => `${value}%`}
                max={100}
                min={10}
                disabled={form.getFieldValue('enabled') === 1}
              />
            </Item>
          )}
        </Item>
        <Item>
          <Button type="primary" onClick={handleSave}>保存</Button>
        </Item>
      </Form>
    </div>
  )
}

export default function SettingPageWithRecoil(props: Props) {
  return (
    <RecoilRoot>
      <SettingPage {...props} />
    </RecoilRoot>
  )
}
